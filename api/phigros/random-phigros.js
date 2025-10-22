const express = require('express');
const PhigrosSong = require('../../settings/PhigrosSong');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { difficulty, level } = req.query;
    const filter = {};
    let projection = { name: 1, composers: 1, _id: 0 };

    if (difficulty) {
      const diff = difficulty.toLowerCase();
      const validDiffs = ['ez', 'hd', 'in', 'at'];

      if (!validDiffs.includes(diff)) {
        return res.status(400).json({
          error: 'difficultyは ez, hd, in, at のいずれかで指定してください'
        });
      }

      if (level) {
        const lvl = parseInt(level, 10);
        if (isNaN(lvl)) {
          return res.status(400).json({ error: 'levelは整数で指定してください' });
        }
        filter[`difficulties.${diff}`] = lvl;
      } else {
        filter[`difficulties.${diff}`] = { $ne: null };
      }

      projection[`difficulties.${diff}`] = 1;
    } else {
      projection.difficulties = 1;
    }

    const songs = await PhigrosSong.find(filter, projection);

    if (!songs.length) {
      return res.status(404).json({ error: '該当曲が見つかりませんでした' });
    }

    const formatted = songs.map(song => {
      const result = {
        name: song.name,
        composers: song.composers,
        difficulties: {}
      };

      if (difficulty) {
        result.difficulties[difficulty.toLowerCase()] =
          song.difficulties?.[difficulty.toLowerCase()] ?? null;
      } else {
        result.difficulties = song.difficulties;
      }

      return result;
    });

    res.json({
      status: '取得成功',
      count: formatted.length,
      songs: formatted
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
