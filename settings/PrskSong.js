const mongoose = require('mongoose');

const PrskSongSchema = new mongoose.Schema({
  name: { type: String, required: true },
  difficulties: {
    easy: { type: Number, default: null },
    normal: { type: Number, default: null },
    hard: { type: Number, default: null },
    expert: { type: Number, default: null },
    master: { type: Number, default: null },
    append: { type: Number, default: null },
  }
});

module.exports = mongoose.model('PrskSongs', PrskSongSchema);
