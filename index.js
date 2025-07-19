const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDBに接続しました'))
  .catch(err => console.error('❌ MongoDB接続エラー:', err));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/genre-config', express.static('settings'));
app.use(express.static('public'));

app.use('/api/upload', require('./api/upload'));
app.use('/api/add', require('./api/add'));
app.use('/api/delete', require('./api/delete'));
app.use('/api/random-taiko', require('./api/random-taiko'));

app.get('/:page.html', (req, res) => res.redirect(301, `/${req.params.page}`));
app.get('/:page', (req, res, next) => {
  if (req.params.page.includes('.')) return next();
  res.sendFile(path.join(__dirname, 'public', `${req.params.page}.html`), err => err && next());
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