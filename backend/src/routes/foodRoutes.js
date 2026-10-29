const express = require('express');
const mongoose = require('mongoose');
const Food = require('../models/Food');

const router = express.Router();

function normalizeVietnamese(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function parseIngredients(rawIngredients) {
  if (Array.isArray(rawIngredients)) {
    return rawIngredients
      .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
      .filter(Boolean);
  }
  if (typeof rawIngredients === 'string') {
    return rawIngredients
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function validateFoodInput(body = {}) {
  const errors = [];

  const foodId = typeof body.foodId === 'string' ? body.foodId.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const cuisine = typeof body.cuisine === 'string' ? body.cuisine.trim() : '';
  const ingredients = parseIngredients(body.ingredients);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';

  if (!foodId) errors.push('Mã món ăn (foodId) không được để trống.');
  if (!name) errors.push('Tên món ăn (name) không được để trống.');
  if (!category) errors.push('Loại món ăn (category) không được để trống.');
  if (!cuisine) errors.push('Ẩm thực / vùng miền (cuisine) không được để trống.');
  if (ingredients.length === 0) {
    errors.push('Danh sách nguyên liệu (ingredients) phải có ít nhất 1 nguyên liệu.');
  }

  const rawPrice = body.price;
  const price =
    rawPrice === '' || rawPrice === null || rawPrice === undefined || typeof rawPrice === 'boolean'
      ? NaN
      : Number(rawPrice);
  if (!Number.isFinite(price) || price < 0) {
    errors.push('Giá bán (price) phải là số lớn hơn hoặc bằng 0.');
  }

  const rawQuantity = body.quantity;
  const quantity =
    rawQuantity === '' || rawQuantity === null || rawQuantity === undefined || typeof rawQuantity === 'boolean'
      ? NaN
      : Number(rawQuantity);
  if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    errors.push('Số lượng hiện có (quantity) phải là số nguyên lớn hơn hoặc bằng 0.');
  }

  return {
    errors,
    data: {
      foodId,
      name,
      category,
      cuisine,
      ingredients,
      price,
      quantity,
      description,
      imageUrl,
    },
  };
}

async function findFoodByIdOrCode(idParam) {
  const trimmed = String(idParam || '').trim();
  if (!trimmed) return null;

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byObjectId = await Food.findById(trimmed);
    if (byObjectId) return byObjectId;
  }

  return Food.findOne({ foodId: trimmed });
}

router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Cơ sở dữ liệu MongoDB Atlas hiện chưa sẵn sàng kết nối.',
    });
  }
  return next();
});

// GET /api/foods & GET /api/foods?search=...
router.get('/', async (req, res, next) => {
  try {
    const allFoods = await Food.find().sort({ foodId: 1 });
    const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    if (!rawSearch) {
      return res.status(200).json(allFoods);
    }

    const keyword = normalizeVietnamese(rawSearch);
    const filtered = allFoods.filter((food) => {
      const candidates = [
        food.foodId,
        food.name,
        food.category,
        food.cuisine,
        ...(Array.isArray(food.ingredients) ? food.ingredients : []),
      ];
      return candidates.some((field) => normalizeVietnamese(field).includes(keyword));
    });

    return res.status(200).json(filtered);
  } catch (err) {
    return next(err);
  }
});

// GET /api/foods/:id
router.get('/:id', async (req, res, next) => {
  try {
    const food = await findFoodByIdOrCode(req.params.id);
    if (!food) {
      return res.status(404).json({
        message: `Không tìm thấy món ăn với mã định danh "${req.params.id}".`,
      });
    }
    return res.status(200).json(food);
  } catch (err) {
    return next(err);
  }
});

// POST /api/foods
router.post('/', async (req, res, next) => {
  try {
    const { errors, data } = validateFoodInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: errors[0],
        errors,
      });
    }

    const existing = await Food.findOne({ foodId: data.foodId });
    if (existing) {
      return res.status(409).json({
        message: `Mã món ăn "${data.foodId}" đã tồn tại. Vui lòng chọn mã foodId khác.`,
      });
    }

    const created = await Food.create(data);
    return res.status(201).json(created);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/foods/:id
router.put('/:id', async (req, res, next) => {
  try {
    const target = await findFoodByIdOrCode(req.params.id);
    if (!target) {
      return res.status(404).json({
        message: `Không tìm thấy món ăn với mã định danh "${req.params.id}".`,
      });
    }

    const { errors, data } = validateFoodInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: errors[0],
        errors,
      });
    }

    const duplicate = await Food.findOne({
      foodId: data.foodId,
      _id: { $ne: target._id },
    });
    if (duplicate) {
      return res.status(409).json({
        message: `Mã món ăn "${data.foodId}" đã tồn tại ở bản ghi khác.`,
      });
    }

    Object.assign(target, data);
    const updated = await target.save();
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/foods/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const target = await findFoodByIdOrCode(req.params.id);
    if (!target) {
      return res.status(404).json({
        message: `Không tìm thấy món ăn với mã định danh "${req.params.id}".`,
      });
    }

    await Food.deleteOne({ _id: target._id });
    return res.status(200).json({
      message: `Đã xóa món ăn "${target.name}" (${target.foodId}) thành công.`,
      food: target,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
