const express = require('express');
const TaikoSong = require('../settings/TaikoSong');
const { validateAdminPass } = require('./utils');

const router = express.Router();

router.post('/', async (req, res) => {
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

module.exports = router;