const express = require('express');
const multer = require('multer');
const TaikoSong = require('../../settings/TaikoSong');
const { validateAdminPass } = require('../utils');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('jsonFile'), async (req, res, next) => {
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

module.exports = router;