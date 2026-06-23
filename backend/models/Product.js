const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  series: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  image: { type: String, default: '' },
  tag: { type: String, default: '' },
  tagText: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
