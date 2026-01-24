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
        min: 0.5  // Support half portions
    },
    personNumber: {
        type: Number,
        required: false,  // Optional for backward compatibility
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: 'Person number must be an integer'
        }
    },
    paidStatus: {
        type: Boolean,
        default: false  // Track if individual item is paid
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
        enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'partially_paid', 'paid'],
        default: 'pending'
    },
    total: {
        type: Number,
        required: false  // Not required - calculated by pre-save hook
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
