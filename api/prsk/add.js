// api/prsk/prskAdd.js
const express = require('express');
const PrskSong = require('../../settings/PrskSong');
const { validateAdminPass } = require('../utils');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, difficulties, adminPass } = req.body;

    // 管理者パスワードチェック
    if (!await validateAdminPass(adminPass)) {
      return res.status(401).json({ error: '不正なパスワードです' });
    }

    // 必須項目チェック
    if (!name || typeof difficulties !== 'object') {
      return res.status(400).json({ error: 'name, difficulties は必須です' });
    }

    // 重複チェック
    const exists = await PrskSong.findOne({ name });
    if (exists) return res.status(409).json({ error: '同名の曲が存在します', name });

    // 小文字キーに変換して型保証
    await PrskSong.create({
      name,
      difficulties: {
        easy: difficulties.EASY != null ? parseInt(difficulties.EASY, 10) : null,
        normal: difficulties.NORMAL != null ? parseInt(difficulties.NORMAL, 10) : null,
        hard: difficulties.HARD != null ? parseInt(difficulties.HARD, 10) : null,
        expert: difficulties.EXPERT != null ? parseInt(difficulties.EXPERT, 10) : null,
        master: difficulties.MASTER != null ? parseInt(difficulties.MASTER, 10) : null,
        append: difficulties.APPEND != null ? parseInt(difficulties.APPEND, 10) : null,
      }
    });

    res.json({ status: '新しい曲を追加しました', name });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
