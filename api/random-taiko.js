const express = require('express');
const TaikoSong = require('../settings/TaikoSong');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { count = 1, genre, difficulty, stars, excludeSouuchi } = req.query;
    const num = parseInt(count);
    if (isNaN(num) || num < 1 || num > 10) {
      return res.status(400).json({ error: 'countは1〜10の整数で指定してください' });
    }

    const filter = {};
    if (genre) filter.genre = genre;
    const starNum = stars ? parseInt(stars) : null;

    if (difficulty) {
      if (starNum !== null && isNaN(starNum)) {
        return res.status(400).json({ error: '★の数は整数で指定してください' });
      }

      if (difficulty === 'oni-edit') {
        filter.$or = [
          { 'difficulties.oni': starNum },
          { 'difficulties.edit': starNum },
        ];
      } else {
        filter[`difficulties.${difficulty}`] = starNum ?? { $ne: null };
      }
    }

    if (excludeSouuchi === 'true') {
      filter.title = { $not: /双打/ };
    }

    const results = await TaikoSong.find(filter);
    if (!results.length) {
      return res.status(404).json({ error: '該当曲が見つかりませんでした' });
    }

    const unique = Array.from(new Map(results.map(s => [s.title, s])).values());

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