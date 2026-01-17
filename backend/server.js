require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pide-otagi', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB bağlantısı başarılı'))
    .catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🍕 Pide Otağı API çalışıyor!',
        version: '1.0.0',
        endpoints: {
            orders: '/api/orders',
            activeOrders: '/api/orders/active'
        }
    });
});

// GET - Tüm siparişleri getir
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Aktif siparişleri getir
app.get('/api/orders/active', async (req, res) => {
    try {
        const orders = await Order.find({
            status: { $in: ['pending', 'preparing'] }
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Belirli bir siparişi getir
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Yeni sipariş oluştur
app.post('/api/orders', async (req, res) => {
    try {
        const { tableNumber, items } = req.body;

        if (!tableNumber || !items || items.length === 0) {
            return res.status(400).json({
                error: 'Masa numarası ve en az bir ürün gerekli'
            });
        }

        const order = new Order({
            tableNumber,
            items
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Sipariş durumunu güncelle
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'preparing', 'completed'].includes(status)) {
            return res.status(400).json({
                error: 'Geçersiz sipariş durumu. (pending, preparing, completed)'
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Sipariş sil
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        res.json({ message: 'Sipariş başarıyla silindi', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Sunucu hatası!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📍 Health check: http://localhost:${PORT}`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api/orders`);
});
