const mongoose = require('mongoose');

const TaikoSongSchema = new mongoose.Schema({
  title: String,
  genre: String,
  difficulties: {
    easy: Number,
    normal: Number,
    hard: Number,
    oni: Number,
    edit: Number
  }
});

module.exports = mongoose.model('TaikoSong', TaikoSongSchema);