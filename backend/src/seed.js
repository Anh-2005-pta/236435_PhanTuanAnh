require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Food = require('./models/Food');

const sampleFoods = [
  {
    foodId: 'FD001',
    name: 'Phở Bò Hà Nội',
    category: 'Món nước',
    cuisine: 'Miền Bắc',
    ingredients: ['Bánh phở tươi', 'Thịt bò tái nạm', 'Xương ống bò', 'Quế hồi thảo quả', 'Hành lá', 'Rau thơm'],
    price: 55000,
    quantity: 40,
    description: 'Phở bò truyền thống Hà Nội với nước dùng ninh xương trong ngọt thanh và hương thảo mộc đặc trưng.',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
  },
  {
    foodId: 'FD002',
    name: 'Bún Bò Huế',
    category: 'Món nước',
    cuisine: 'Miền Trung',
    ingredients: ['Bún sợi to', 'Bắp bò', 'Giò heo', 'Chả cua', 'Sả tươi', 'Mắm ruốc Huế'],
    price: 60000,
    quantity: 35,
    description: 'Đặc sản cố đô Huế đậm đà vị sả, mắm ruốc và ớt chưng thơm nồng.',
    imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80',
  },
  {
    foodId: 'FD003',
    name: 'Cơm Tấm Sài Gòn Sườn Bì Chả',
    category: 'Món cơm',
    cuisine: 'Miền Nam',
    ingredients: ['Gạo tấm', 'Sườn cốt lết nướng', 'Bì thính', 'Chả trứng hấp', 'Mỡ hành', 'Nước mắm chua ngọt'],
    price: 50000,
    quantity: 50,
    description: 'Cơm tấm truyền thống miền Nam ăn kèm sườn nướng than hoa, bì, chả trứng và đồ chua.',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  },
  {
    foodId: 'FD004',
    name: 'Gỏi Cuốn Tôm Thịt',
    category: 'Khai vị',
    cuisine: 'Miền Nam',
    ingredients: ['Bánh tráng', 'Tôm tươi', 'Thịt ba chỉ luộc', 'Bún tươi', 'Rau sống', 'Tương đậu phộng'],
    price: 35000,
    quantity: 60,
    description: 'Món khai vị thanh mát cuốn tôm thịt tươi cùng rau thơm, chấm sốt tương đậu phộng béo bùi.',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
  },
  {
    foodId: 'FD005',
    name: 'Phở Gà Ta Lá Chanh',
    category: 'Món nước',
    cuisine: 'Miền Bắc',
    ingredients: ['Bánh phở', 'Thịt gà ta luộc', 'Nước dùng gà', 'Lá chanh thái chỉ', 'Hành hoa', 'Gừng nướng'],
    price: 50000,
    quantity: 30,
    description: 'Phở gà ta da giòn thịt chắc kết hợp nước dùng ngọt tự nhiên và hương lá chanh thơm dịu.',
    imageUrl: 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?auto=format&fit=crop&w=800&q=80',
  },
];

async function seedFoods() {
  try {
    await connectDB();
    await Food.init();

    for (const item of sampleFoods) {
      await Food.findOneAndUpdate(
        { foodId: item.foodId },
        { $set: item },
        { upsert: true, new: true, runValidators: true }
      );
    }

    const total = await Food.countDocuments();
    console.log(`Seeded sample foods successfully. Total records in 'foods' collection: ${total}`);
  } catch (err) {
    console.error('Failed to seed foods:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedFoods();
}

module.exports = { sampleFoods, seedFoods };
