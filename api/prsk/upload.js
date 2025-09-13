// api/prsk/prskUpload.js
const express = require('express');
const multer = require('multer');
const PrskSong = require('../../settings/PrskSong');
const { validateAdminPass } = require('../utils');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('jsonFile'), async (req, res, next) => {
  try {
    // 管理者パスワードチェック
    if (!await validateAdminPass(req.body.adminPass)) {
      return res.status(401).json({ error: '不正なパスワードです' });
    }

    // ファイルチェック
    if (!req.file) return res.status(400).json({ error: 'ファイルがありません' });

    // JSONパース
    const data = JSON.parse(req.file.buffer.toString());
    if (!Array.isArray(data)) return res.status(400).json({ error: 'JSONは配列形式である必要があります' });

    // 小文字キーに変換して型を保証
    const formatted = data.map(song => ({
      name: song.name,
      difficulties: {
        easy: song.EASY != null ? parseInt(song.EASY, 10) : null,
        normal: song.NORMAL != null ? parseInt(song.NORMAL, 10) : null,
        hard: song.HARD != null ? parseInt(song.HARD, 10) : null,
        expert: song.EXPERT != null ? parseInt(song.EXPERT, 10) : null,
        master: song.MASTER != null ? parseInt(song.MASTER, 10) : null,
        append: song.APPEND != null ? parseInt(song.APPEND, 10) : null,
      }
    }));

    // 既存データを削除して新規挿入
    await PrskSong.deleteMany({});
    await PrskSong.insertMany(formatted);

    res.json({ status: 'アップロード完了', count: formatted.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
