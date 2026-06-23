const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { seedDefaults } = require('./utils/database');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const couponsRouter = require('./routes/coupons');
const { login } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://animestyleshop.vercel.app', 'https://shop-one-sandy.vercel.app', 'http://localhost:3000', 'http://localhost:5500']
}));
app.use(express.json({ limit: '5mb' }));

app.post('/api/auth/login', login);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/coupons', couponsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  await connectDB();
  await seedDefaults();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

start();
