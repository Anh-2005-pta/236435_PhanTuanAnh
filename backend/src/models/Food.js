const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      required: [true, 'Mã món ăn (foodId) là bắt buộc'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên món ăn (name) là bắt buộc'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Loại món ăn (category) là bắt buộc'],
      trim: true,
    },
    cuisine: {
      type: String,
      required: [true, 'Ẩm thực / vùng miền (cuisine) là bắt buộc'],
      trim: true,
    },
    ingredients: {
      type: [String],
      required: [true, 'Danh sách nguyên liệu (ingredients) là bắt buộc'],
      validate: {
        validator(val) {
          return Array.isArray(val) && val.length > 0 && val.every((item) => typeof item === 'string' && item.trim().length > 0);
        },
        message: 'Danh sách nguyên liệu phải có ít nhất 1 nguyên liệu hợp lệ',
      },
    },
    price: {
      type: Number,
      required: [true, 'Giá bán (price) là bắt buộc'],
      min: [0, 'Giá bán không được nhỏ hơn 0'],
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng hiện có (quantity) là bắt buộc'],
      min: [0, 'Số lượng không được nhỏ hơn 0'],
      default: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'foods',
  }
);

module.exports = mongoose.model('Food', foodSchema);
