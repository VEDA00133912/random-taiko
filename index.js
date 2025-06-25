const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const TaikoSong = require('./settings/TaikoSong');

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDBに接続しました'))
  .catch(err => console.error('❌ MongoDB接続エラー:', err));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/genre-config', express.static('settings'));
app.use(express.static('public'));

app.get('/:page.html', (req, res) => res.redirect(301, `/${req.params.page}`));
app.get('/:page', (req, res, next) => {
  if (req.params.page.includes('.')) return next();
  res.sendFile(path.join(__dirname, 'public', `${req.params.page}.html`), err => err && next());
});

async function validateAdminPass(inputPass) {
  const storedHash = process.env.ADMIN_PASS;
  if (!inputPass || !storedHash) return false;
  try {
    return await bcrypt.compare(inputPass, storedHash);
  } catch {
    return false;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('jsonFile'), async (req, res, next) => {
  try {
    if (!await validateAdminPass(req.body.adminPass)) {
      return res.status(401).json({ error: '不正なパスワードです' });
    }

    if (!req.file) return res.status(400).json({ error: 'ファイルがありません' });

    const data = JSON.parse(req.file.buffer.toString());
    if (!Array.isArray(data)) return res.status(400).json({ error: 'JSONは配列形式である必要があります' });

    await TaikoSong.deleteMany({});
    await TaikoSong.insertMany(data);

    res.json({ status: 'アップロード完了', count: data.length });
  } catch (err) {
    next(err);
  }
});

app.post('/api/add', async (req, res, next) => {
  try {
    const { title, genre, difficulties, adminPass } = req.body;

    if (!await validateAdminPass(adminPass)) {
      return res.status(401).json({ error: '不正なパスワードです' });
    }

    if (!title || !genre || typeof difficulties !== 'object') {
      return res.status(400).json({ error: 'title, genre, difficulties は必須です' });
    }

    const exists = await TaikoSong.findOne({ title });
    if (exists) return res.status(409).json({ error: '同名の曲が存在します', title });

    await TaikoSong.create({ title, genre, difficulties });
    res.json({ status: '新しい曲を追加しました', title });
  } catch (err) {
    next(err);
  }
});

app.post('/api/delete', async (req, res) => {
  const { title, adminPass } = req.body;

  if (!await validateAdminPass(adminPass)) {
    return res.status(401).json({ error: '不正なパスワードです' });
  }

  try {
    const deleted = await TaikoSong.findOneAndDelete({ title });
    if (!deleted) return res.status(404).json({ error: '曲が見つかりません' });
    res.json({ status: '削除成功', title: deleted.title });
  } catch (err) {
    res.status(500).json({ error: '削除中にエラーが発生しました', detail: err.message });
  }
});

app.get('/api/random-taiko', async (req, res, next) => {
  try {
    const { count = 1, genre, difficulty, stars, excludeSouuchi } = req.query;
    const num = parseInt(count);
    if (isNaN(num) || num < 1 || num > 10) {
      return res.status(400).json({ error: 'countは1〜10の整数で指定してください' });
    }

    const filter = {};
    if (genre) filter.genre = genre;
    const starNum = stars ? parseInt(stars) : null;

    if (difficulty === 'oni-edit') {
      filter.$or = [
        { 'difficulties.oni': starNum ?? { $ne: null } },
        { 'difficulties.edit': starNum ?? { $ne: null } }
      ];
    } else if (difficulty) {
      if (starNum !== null && isNaN(starNum)) {
        return res.status(400).json({ error: '★の数は整数で指定してください' });
      }
      filter[`difficulties.${difficulty}`] = starNum ?? { $ne: null };
    }

    if (excludeSouuchi === 'true') {
      filter.title = { $not: /双打/ };
    }

    const results = await TaikoSong.find(filter);
    if (!results.length) {
      return res.status(404).json({ error: '該当曲が見つかりませんでした' });
    }

    const unique = Array.from(new Map(results.map(s => [s.title, s])).values());
    if (unique.length < num) {
      return res.status(400).json({ error: `要求数(${num})に対して${unique.length}件のみ` });
    }

    const shuffled = unique.sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, num));
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'APIエンドポイントが存在しません' });
  } else {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('❌ エラー発生:', err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON構文エラー' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: 'アップロードエラー', detail: err.message });
  }
  res.status(500).json({ error: 'サーバー内部エラー', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
});