const express = require('express');
const PrskSong = require('../../settings/PrskSong');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const songs = await PrskSong.find();
    if (songs.length === 0) {
      return res.status(404).json({ error: '曲データが存在しません' });
    }

    res.json({
      status: '取得成功',
      count: songs.length,
      songs
    });
  } catch (err) {
    res.status(500).json({
      error: 'データ取得中にエラーが発生しました',
      detail: err.message
    });
  }
});

module.exports = router;
