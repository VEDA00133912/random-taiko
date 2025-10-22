const mongoose = require('mongoose');

const PhigrosSongSchema = new mongoose.Schema({
  name: { type: String, required: true },
  difficulties: {
    ez: { type: Number, default: null },
    hd: { type: Number, default: null },
    in: { type: Number, default: null },
    at: { type: Number, default: null },
  },
  composers: [String],
});

module.exports = mongoose.model('Phigros', PhigrosSongSchema);
