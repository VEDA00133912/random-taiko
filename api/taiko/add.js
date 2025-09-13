const express = require('express');
const TaikoSong = require('../../settings/TaikoSong');
const { validateAdminPass } = require('../utils');

const router = express.Router();

router.post('/', async (req, res, next) => {
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

module.exports = router;