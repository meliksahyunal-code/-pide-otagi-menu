const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const orderSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: true
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['pending', 'preparing', 'completed'],
        default: 'pending'
    },
    total: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Toplam tutarı otomatik hesapla
orderSchema.pre('save', function (next) {
    this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    next();
});

module.exports = mongoose.model('Order', orderSchema);
