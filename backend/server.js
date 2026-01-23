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
        version: '2.0.0',
        endpoints: {
            orders: '/api/orders',
            activeOrders: '/api/orders/active',
            statistics: '/api/statistics/*'
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

// GET - Aktif siparişleri getir (exclude cancelled and paid)
app.get('/api/orders/active', async (req, res) => {
    try {
        const orders = await Order.find({
            status: { $in: ['pending', 'preparing', 'ready', 'delivered'] }
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

        const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'paid'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Geçersiz sipariş durumu. İzin verilen: ${validStatuses.join(', ')}`
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

// PATCH - Sipariş durumunu güncelle (shorter endpoint)
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'paid'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Geçersiz sipariş durumu. İzin verilen: ${validStatuses.join(', ')}`
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

// POST - Masa için tüm siparişleri ödenmiş olarak işaretle
app.post('/api/tables/:tableNumber/pay-all', async (req, res) => {
    try {
        const { tableNumber } = req.params;

        const result = await Order.updateMany(
            {
                tableNumber: tableNumber,
                status: { $nin: ['cancelled', 'paid'] } // Don't update already cancelled/paid
            },
            { status: 'paid' }
        );

        res.json({
            message: `Masa ${tableNumber} için ${result.modifiedCount} sipariş ödendi`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Belirli bir kişinin siparişlerini ödenmiş olarak işaretle
app.post('/api/tables/:tableNumber/pay-person/:personNumber', async (req, res) => {
    try {
        const { tableNumber, personNumber } = req.params;
        const personNum = parseInt(personNumber);

        // Find all orders for this table
        const orders = await Order.find({
            tableNumber: tableNumber,
            status: { $nin: ['cancelled', 'paid'] }
        });

        let modifiedCount = 0;
        for (const order of orders) {
            // Check if this order has items for this person
            const hasPersonItems = order.items.some(item => item.personNumber === personNum);

            if (hasPersonItems) {
                // Check if all items belong to this person
                const allItemsForPerson = order.items.every(item =>
                    !item.personNumber || item.personNumber === personNum
                );

                if (allItemsForPerson) {
                    // If all items are for this person, mark entire order as paid
                    order.status = 'paid';
                    await order.save();
                    modifiedCount++;
                } else {
                    // Mixed order - need to split (for now, we'll just mark items)
                    // In a real app, you might want to create separate orders
                    console.log(`Mixed order ${order._id} - contains items for multiple people`);
                }
            }
        }

        res.json({
            message: `Masa ${tableNumber} - Kişi ${personNumber} için ${modifiedCount} sipariş ödendi`,
            modifiedCount: modifiedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Masa için kişilere göre sipariş dökümü
app.get('/api/tables/:tableNumber/breakdown', async (req, res) => {
    try {
        const { tableNumber } = req.params;

        const orders = await Order.find({
            tableNumber: tableNumber,
            status: { $nin: ['cancelled', 'paid'] }
        });

        // Group items by person
        const personBreakdown = {};
        let totalAmount = 0;

        orders.forEach(order => {
            order.items.forEach(item => {
                const personNum = item.personNumber || 1; // Default to Kişi 1

                if (!personBreakdown[personNum]) {
                    personBreakdown[personNum] = {
                        personNumber: personNum,
                        items: [],
                        total: 0
                    };
                }

                const itemTotal = item.price * item.quantity;
                personBreakdown[personNum].items.push({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: itemTotal
                });
                personBreakdown[personNum].total += itemTotal;
                totalAmount += itemTotal;
            });
        });

        // Convert to array and sort by person number
        const breakdown = Object.values(personBreakdown).sort((a, b) => a.personNumber - b.personNumber);

        res.json({
            tableNumber,
            breakdown,
            totalAmount,
            personCount: breakdown.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// GET - Günlük istatistikler
app.get('/api/statistics/daily', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Calculate statistics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        // Item breakdown
        const itemMap = {};
        let totalItemsSold = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                totalItemsSold += item.quantity;
                if (!itemMap[item.id]) {
                    itemMap[item.id] = {
                        id: item.id,
                        name: item.name,
                        count: 0,
                        revenue: 0
                    };
                }
                itemMap[item.id].count += item.quantity;
                itemMap[item.id].revenue += item.price * item.quantity;
            });
        });

        const itemBreakdown = Object.values(itemMap).sort((a, b) => b.count - a.count);
        const mostPopularItem = itemBreakdown[0] || null;

        // Status breakdown
        const statusBreakdown = {
            pending: orders.filter(o => o.status === 'pending').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            paid: orders.filter(o => o.status === 'paid').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length
        };

        res.json({
            date,
            totalOrders,
            totalRevenue,
            totalItemsSold,
            averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            mostPopularItem,
            itemBreakdown,
            statusBreakdown
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Aylık istatistikler
app.get('/api/statistics/monthly', async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);
        const [year, monthNum] = month.split('-').map(Number);

        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Calculate statistics (same logic as daily)
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        const itemMap = {};
        let totalItemsSold = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                totalItemsSold += item.quantity;
                if (!itemMap[item.id]) {
                    itemMap[item.id] = {
                        id: item.id,
                        name: item.name,
                        count: 0,
                        revenue: 0
                    };
                }
                itemMap[item.id].count += item.quantity;
                itemMap[item.id].revenue += item.price * item.quantity;
            });
        });

        const itemBreakdown = Object.values(itemMap).sort((a, b) => b.count - a.count);
        const mostPopularItem = itemBreakdown[0] || null;

        const statusBreakdown = {
            pending: orders.filter(o => o.status === 'pending').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            paid: orders.filter(o => o.status === 'paid').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length
        };

        res.json({
            month,
            totalOrders,
            totalRevenue,
            totalItemsSold,
            averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            mostPopularItem,
            itemBreakdown,
            statusBreakdown
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Haftalık trendler
app.get('/api/statistics/weekday-trends', async (req, res) => {
    try {
        const weeks = parseInt(req.query.weeks) || 4;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (weeks * 7));

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'cancelled' }
        });

        // Group by weekday
        const weekdayMap = {
            0: { name: 'Pazar', orders: 0, revenue: 0, count: 0 },
            1: { name: 'Pazartesi', orders: 0, revenue: 0, count: 0 },
            2: { name: 'Salı', orders: 0, revenue: 0, count: 0 },
            3: { name: 'Çarşamba', orders: 0, revenue: 0, count: 0 },
            4: { name: 'Perşembe', orders: 0, revenue: 0, count: 0 },
            5: { name: 'Cuma', orders: 0, revenue: 0, count: 0 },
            6: { name: 'Cumartesi', orders: 0, revenue: 0, count: 0 }
        };

        orders.forEach(order => {
            const dayOfWeek = new Date(order.createdAt).getDay();
            weekdayMap[dayOfWeek].orders += 1;
            weekday

            Map[dayOfWeek].revenue += order.total || 0;
            weekdayMap[dayOfWeek].count += 1;
        });

        const weekdayAverages = {};
        let bestDay = null;
        let worstDay = null;
        let maxRevenue = 0;
        let minRevenue = Infinity;

        Object.entries(weekdayMap).forEach(([day, data]) => {
            const avgRevenue = data.count > 0 ? Math.round(data.revenue / weeks) : 0;
            weekdayAverages[data.name] = {
                orders: Math.round(data.orders / weeks),
                revenue: avgRevenue
            };

            if (avgRevenue > maxRevenue) {
                maxRevenue = avgRevenue;
                bestDay = data.name;
            }
            if (avgRevenue < minRevenue && avgRevenue > 0) {
                minRevenue = avgRevenue;
                worstDay = data.name;
            }
        });

        res.json({
            weekdayAverages,
            bestDay,
            worstDay
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - En çok satılan ürünler
app.get('/api/statistics/top-items', async (req, res) => {
    try {
        const period = req.query.period || 'day';
        const limit = parseInt(req.query.limit) || 10;

        let startDate;
        const endDate = new Date();

        if (period === 'day') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'cancelled' }
        });

        const itemMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!itemMap[item.id]) {
                    itemMap[item.id] = {
                        id: item.id,
                        name: item.name,
                        count: 0,
                        revenue: 0
                    };
                }
                itemMap[item.id].count += item.quantity;
                itemMap[item.id].revenue += item.price * item.quantity;
            });
        });

        const topItems = Object.values(itemMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        res.json(topItems);
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
    console.log(`📍 Statistics: http://localhost:${PORT}/api/statistics/daily`);
});
