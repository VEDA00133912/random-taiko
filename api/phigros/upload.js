// api/prsk/phigrosUpload.js
const express = require('express');
const multer = require('multer');
const PhigrosSong = require('../../settings/PhigrosSong');
const { validateAdminPass } = require('../utils');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('jsonFile'), async (req, res, next) => {
  try {
    // 管理者パスワードチェック
    if (!await validateAdminPass(req.body.adminPass)) {
      return res.status(401).json({ error: '不正なパスワードです' });
    }

    if (!req.file) return res.status(400).json({ error: 'ファイルがありません' });

    const data = JSON.parse(req.file.buffer.toString());
    if (!Array.isArray(data)) return res.status(400).json({ error: 'JSONは配列形式である必要があります' });

    const formatted = data.map(song => ({
      name: song.title,
      difficulties: {
        ez: song.difficulties.EZ != null ? parseInt(song.difficulties.EZ, 10) : null,
        hd: song.difficulties.HD != null ? parseInt(song.difficulties.HD, 10) : null,
        in: song.difficulties.IN != null ? parseInt(song.difficulties.IN, 10) : null,
        at: song.difficulties.AT != null ? parseInt(song.difficulties.AT, 10) : null,
      },
      composers: Array.isArray(song.composers) ? song.composers : []
    }));

    // 既存データを削除して新規挿入
    await PhigrosSong.deleteMany({});
    await PhigrosSong.insertMany(formatted);

    res.json({ status: 'アップロード完了', count: formatted.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
