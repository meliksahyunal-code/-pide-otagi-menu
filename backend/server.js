require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── MongoDB ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pide-otagi', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB bağlantısı başarılı'))
    .catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

// ─── Keep-alive (Render.com uyutmama) ────────────────────────────────────────
// Print Agent ve diğer istemciler her 10 dakikada bunu çağırır
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Sağlık kontrolü
app.get('/', (req, res) => {
    res.json({
        message: '🍕 Pide Otağı API çalışıyor!',
        version: '3.0.0',
        endpoints: {
            orders: '/api/orders',
            activeOrders: '/api/orders/active',
            unprintedOrders: '/api/orders/unprinted',
            ping: '/api/ping'
        }
    });
});

// ─── SİPARİŞLER ──────────────────────────────────────────────────────────────

// Tüm siparişleri getir
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Aktif siparişleri getir (sadece pending)
app.get('/api/orders/active', async (req, res) => {
    try {
        const orders = await Order.find({
            status: 'pending'
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Basılmamış siparişleri getir — Print Agent kullanır
app.get('/api/orders/unprinted', async (req, res) => {
    try {
        const orders = await Order.find({
            printed: false,
            status: { $ne: 'cancelled' }
        }).sort({ createdAt: 1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Belirli bir siparişi getir
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Yeni sipariş oluştur
app.post('/api/orders', async (req, res) => {
    try {
        const { tableNumber, items } = req.body;

        if (!tableNumber || !items || items.length === 0) {
            return res.status(400).json({ error: 'Masa numarası ve en az bir ürün gerekli' });
        }

        // Günlük sıra numarası
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Order.countDocuments({ createdAt: { $gte: today } });
        const orderNumber = todayCount + 1;

        // Sadece içecek mi kontrol et (id > 7 = içecek)
        const hasPide = items.some(i => i.id <= 7);
        // Sadece içecekse otomatik printed: true yap (fiş basılmayacak)
        const shouldPrint = hasPide;

        const order = new Order({
            tableNumber,
            items,
            orderNumber,
            printed: !shouldPrint   // sadece içecekse baştan true
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Siparişi iptal et
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
        res.json({ message: 'Sipariş iptal edildi', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sipariş durumunu güncelle (sadece paid/cancelled gerekli artık)
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'paid', 'cancelled', 'partially_paid'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Geçersiz durum. İzin verilen: ${validStatuses.join(', ')}` });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT alias (geriye dönük uyumluluk)
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'paid', 'cancelled', 'partially_paid'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Geçersiz durum.` });
        }
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Siparişi basıldı olarak işaretle — Print Agent çağırır
app.patch('/api/orders/:id/mark-printed', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { printed: true, printedAt: new Date() },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ─── KASA ENDPOİNT'LERİ ──────────────────────────────────────────────────────

// Masa için tüm siparişleri ödenmiş yap
app.post('/api/tables/:tableNumber/pay-all', async (req, res) => {
    try {
        const { tableNumber } = req.params;
        const orders = await Order.find({
            tableNumber,
            status: { $nin: ['cancelled', 'paid'] }
        });

        for (const order of orders) {
            order.items.forEach(item => { item.paidStatus = true; });
            order.status = 'paid';
            await order.save();
        }

        res.json({ message: `Masa ${tableNumber} için ${orders.length} sipariş ödendi`, modifiedCount: orders.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Belirli kalemleri ödenmiş yap
app.post('/api/orders/:orderId/pay-items', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { itemIndices } = req.body;
        if (!Array.isArray(itemIndices)) return res.status(400).json({ error: 'itemIndices array olmalı' });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

        itemIndices.forEach(index => {
            if (index >= 0 && index < order.items.length) {
                order.items[index].paidStatus = true;
            }
        });

        const allPaid = order.items.every(i => i.paidStatus);
        const somePaid = order.items.some(i => i.paidStatus);
        if (allPaid) order.status = 'paid';
        else if (somePaid) order.status = 'partially_paid';

        await order.save();
        res.json({ message: `${itemIndices.length} ürün ödendi`, order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Masa ödeme görünümü
app.get('/api/tables/:tableNumber/payment-view', async (req, res) => {
    try {
        const { tableNumber } = req.params;
        const orders = await Order.find({
            tableNumber,
            status: { $nin: ['cancelled', 'paid'] }
        }).sort({ createdAt: 1 });

        const allItems = [];
        orders.forEach(order => {
            order.items.forEach((item, itemIndex) => {
                allItems.push({
                    orderId: order._id,
                    orderCreatedAt: order.createdAt,
                    itemIndex,
                    itemId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    personNumber: item.personNumber || 1,
                    paidStatus: item.paidStatus || false,
                    itemTotal: item.price * item.quantity
                });
            });
        });

        const totalUnpaid = allItems.filter(i => !i.paidStatus).reduce((s, i) => s + i.itemTotal, 0);
        const totalPaid = allItems.filter(i => i.paidStatus).reduce((s, i) => s + i.itemTotal, 0);

        res.json({
            tableNumber,
            items: allItems,
            totalUnpaid,
            totalPaid,
            grandTotal: totalUnpaid + totalPaid,
            itemCount: allItems.length,
            unpaidItemCount: allItems.filter(i => !i.paidStatus).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── İSTATİSTİKLER ───────────────────────────────────────────────────────────

app.get('/api/statistics/daily', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } });
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

        const itemMap = {};
        let totalItemsSold = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                totalItemsSold += item.quantity;
                if (!itemMap[item.id]) itemMap[item.id] = { id: item.id, name: item.name, count: 0, revenue: 0 };
                itemMap[item.id].count += item.quantity;
                itemMap[item.id].revenue += item.price * item.quantity;
            });
        });

        const itemBreakdown = Object.values(itemMap).sort((a, b) => b.count - a.count);
        const statusBreakdown = {
            pending: orders.filter(o => o.status === 'pending').length,
            paid: orders.filter(o => o.status === 'paid').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length
        };

        res.json({
            date, totalOrders, totalRevenue, totalItemsSold,
            averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            mostPopularItem: itemBreakdown[0] || null,
            itemBreakdown, statusBreakdown
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/statistics/monthly', async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

        const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } });
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

        const itemMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!itemMap[item.id]) itemMap[item.id] = { id: item.id, name: item.name, count: 0, revenue: 0 };
                itemMap[item.id].count += item.quantity;
                itemMap[item.id].revenue += item.price * item.quantity;
            });
        });

        res.json({
            month, totalOrders, totalRevenue,
            averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            mostPopularItem: Object.values(itemMap).sort((a, b) => b.count - a.count)[0] || null,
            itemBreakdown: Object.values(itemMap).sort((a, b) => b.count - a.count)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── HATA YÖNETİMİ ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Sunucu hatası!' });
});

// ─── BAŞLAT ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📍 Keep-alive: http://localhost:${PORT}/api/ping`);
});
