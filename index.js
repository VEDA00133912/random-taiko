const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const TaikoSong = require('./settings/TaikoSong');

dotenv.config();
const app = express();
app.use(express.json());
const PORT = 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDBに接続しました'))
  .catch(err => console.error('❌ MongoDBへの接続エラーです:', err));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/genre-config', express.static('settings'));

app.get('/:page.html', (req, res) => {
  res.redirect(301, `/${req.params.page}`);
});

app.get('/:page', (req, res, next) => {
  if (req.params.page.includes('.')) return next(); 
  const filePath = path.join(__dirname, 'public', `${req.params.page}.html`);
  res.sendFile(filePath, err => {
    if (err) next();
  });
});

app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

// API
app.post('/api/upload', upload.single('jsonFile'), async (req, res, next) => {
  try {
    const providedPass = req.body.adminPass;
    if (!providedPass || providedPass !== process.env.ADMIN_PASS) {
      return res.status(401).json({ error: '不正なパスワードです' });
    }

    if (!req.file) return res.status(400).json({ error: 'ファイルが添付されていません' });

    const buffer = req.file.buffer;
    const json = JSON.parse(buffer.toString());

    if (!Array.isArray(json)) {
      return res.status(400).json({ error: 'JSONは配列である必要があります' });
    }

    await TaikoSong.deleteMany({});
    await TaikoSong.insertMany(json);

    res.json({ status: 'アップロード完了', count: json.length });
  } catch (err) {
    next(err);
  }
});

app.post('/api/add', async (req, res, next) => {
  try {
    const { title, genre, difficulties, adminPass } = req.body;

    if (!adminPass || adminPass !== process.env.ADMIN_PASS) {
      return res.status(401).json({ error: '不正なパスワードです' });
    }

    if (
      typeof title !== 'string' || title.trim() === '' ||
      typeof genre !== 'string' || genre.trim() === '' ||
      typeof difficulties !== 'object' || difficulties === null
    ) {
      return res.status(400).json({ error: 'title, genre, difficulties は必須です' });
    }

    const existing = await TaikoSong.findOne({ title });

    if (existing) {
      return res.status(409).json({ status: '同じタイトルの曲が既に存在します', title });
    }

    await TaikoSong.create({ title, genre, difficulties });
    res.json({ status: '新しい曲を追加しました', title });
  } catch (err) {
    next(err);
  }
});

app.get('/api/random-taiko', async (req, res, next) => {
  try {
    const { count = 1, genre, difficulty, stars } = req.query;
    const num = Math.min(parseInt(count), 100);

    const filter = {};
    if (genre) filter.genre = genre;

    if (difficulty === 'oni-edit') {
      filter.$or = [
        { 'difficulties.oni': { $ne: null } },
        { 'difficulties.edit': { $ne: null } }
      ];
      if (stars) {
        filter.$or = [
          { 'difficulties.oni': parseInt(stars) },
          { 'difficulties.edit': parseInt(stars) }
        ];
      }
    } else if (difficulty) {
      if (stars) {
        filter[`difficulties.${difficulty}`] = parseInt(stars);
      } else {
        filter[`difficulties.${difficulty}`] = { $ne: null };
      }
    }

    const matchedSongs = await TaikoSong.find(filter);
    if (matchedSongs.length === 0) {
      return res.status(404).json({ error: '該当する曲が見つかりませんでした' });
    }

    const uniqueSongsMap = new Map();
    for (const song of matchedSongs) {
      if (!uniqueSongsMap.has(song.title)) {
        uniqueSongsMap.set(song.title, song);
      }
    }

    const uniqueSongs = Array.from(uniqueSongsMap.values());

    if (uniqueSongs.length < num) {
      return res.status(400).json({
        error: `リクエスト数(${num})に対して曲数が不足しています`
      });
    }

    const shuffled = uniqueSongs.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, num);

    res.json(selected);
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
  console.error('❌️ エラー発生:', err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSONの構文エラー' });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: 'ファイルアップロードエラー', detail: err.message });
  }

  res.status(500).json({ error: 'サーバー内部エラー', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 サーバー起動 http://localhost:${PORT}`);
});