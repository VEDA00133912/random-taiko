const express = require('express');
const PrskSong = require('../../settings/PrskSong');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { count = 1, difficulty, level } = req.query;
    const num = parseInt(count, 10);

    if (isNaN(num) || num < 1 || num > 10) {
      return res.status(400).json({ error: 'countは1〜10の整数で指定してください' });
    }

    const filter = {};
    if (difficulty) {
      const lvl = level ? parseInt(level, 10) : null;
      if (lvl !== null && isNaN(lvl)) {
        return res.status(400).json({ error: 'levelは整数で指定してください' });
      }
      filter[`difficulties.${difficulty.toLowerCase()}`] = lvl ?? { $ne: null };
    }

    const results = await PrskSong.find(filter);
    if (!results.length) {
      return res.status(404).json({ error: '該当曲が見つかりませんでした' });
    }

    const unique = Array.from(new Map(results.map(s => [s.name, s])).values());

    if (unique.length < num) {
      return res.status(400).json({ error: `要求数(${num})に対して${unique.length}件のみ` });
    }

    const shuffled = unique.sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, num));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
