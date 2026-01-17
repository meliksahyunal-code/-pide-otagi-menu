// Menü verileri - menu.js'den import
const menuData = {
    pides: [
        { id: 1, name: "Kıymalı Pide", price: 140 },
        { id: 2, name: "Çökeleği Pide", price: 130 },
        { id: 3, name: "Kuşbaşılı Pide", price: 180 },
        { id: 4, name: "Karışık Pide", price: 160 },
        { id: 5, name: "Kuşbaşı Kaşarlı Pide", price: 210 },
        { id: 6, name: "Kıymalı Kaşarlı Pide", price: 180 },
        { id: 7, name: "Patatesli Pide", price: 110 },
        { id: 8, name: "Lahmacun", price: 35 }
    ],
    drinks: [
        { id: 9, name: "Su", price: 15 },
        { id: 10, name: "Ayran", price: 20 },
        { id: 11, name: "Salça", price: 30 },
        { id: 12, name: "Gazlı İçecekler", price: 35 },
        { id: 13, name: "Cam Şişe Gazlı İçecekler", price: 45 }
    ]
};

// Tüm ürünleri tek array'de birleştir
const allItems = [...menuData.pides, ...menuData.drinks];

// Sipariş sınıfı
class Order {
    constructor(tableNumber) {
        this.id = Date.now();
        this.tableNumber = tableNumber;
        this.items = [];
        this.status = 'pending'; // pending, preparing, completed
        this.timestamp = new Date().toISOString();
    }

    addItem(itemId, quantity) {
        const item = allItems.find(i => i.id === itemId);
        if (!item) return;

        const existingItem = this.items.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: quantity
            });
        }
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
}

// Sipariş yöneticisi
class OrderManager {
    constructor() {
        this.orders = this.loadOrders();
        this.currentOrder = null;
    }

    loadOrders() {
        const stored = localStorage.getItem('pideOtagiOrders');
        return stored ? JSON.parse(stored) : [];
    }

    saveOrders() {
        localStorage.setItem('pideOtagiOrders', JSON.stringify(this.orders));
    }

    createOrder(tableNumber) {
        this.currentOrder = new Order(tableNumber);
    }

    addItemToCurrentOrder(itemId, quantity) {
        if (!this.currentOrder) return;
        this.currentOrder.addItem(itemId, quantity);
    }

    saveCurrentOrder() {
        if (!this.currentOrder) return;
        this.orders.push(this.currentOrder);
        this.saveOrders();
        this.currentOrder = null;
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.saveOrders();
        }
    }

    deleteOrder(orderId) {
        this.orders = this.orders.filter(o => o.id !== orderId);
        this.saveOrders();
    }

    getActiveOrders() {
        return this.orders.filter(o => o.status !== 'completed');
    }

    getAllOrders() {
        return this.orders;
    }
}

// Global order manager instance
const orderManager = new OrderManager();

// Sayfa yükleme
document.addEventListener('DOMContentLoaded', function () {
    renderMenuSelection();
    renderOrders();

    // Event listeners
    document.getElementById('createOrderBtn').addEventListener('click', handleCreateOrder);
});

// Menü seçimini render et
function renderMenuSelection() {
    const container = document.getElementById('menuSelection');

    let html = '<h3 style="color: var(--primary-gold); margin-bottom: 20px;">Pide Çeşitleri</h3>';
    html += '<div class="menu-grid">';

    menuData.pides.forEach(item => {
        html += `
      <div class="menu-item" onclick="addToOrder(${item.id})">
        <div class="item-name">${item.name}</div>
        <div class="item-price">${item.price}<span class="currency">₺</span></div>
      </div>
    `;
    });

    html += '</div>';
    html += '<h3 style="color: var(--primary-gold); margin: 30px 0 20px;">İçecekler</h3>';
    html += '<div class="menu-grid">';

    menuData.drinks.forEach(item => {
        html += `
      <div class="menu-item" onclick="addToOrder(${item.id})">
        <div class="item-name">${item.name}</div>
        <div class="item-price">${item.price}<span class="currency">₺</span></div>
      </div>
    `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Mevcut siparişe ürün ekle
function addToOrder(itemId) {
    const tableNumber = document.getElementById('tableNumber').value;

    if (!tableNumber) {
        alert('Lütfen önce masa numarası seçin!');
        return;
    }

    if (!orderManager.currentOrder) {
        orderManager.createOrder(tableNumber);
    }

    const quantityStr = prompt('Adet (varsayılan: 1):', '1');
    const quantity = parseInt(quantityStr) || 1;

    if (quantity > 0) {
        orderManager.addItemToCurrentOrder(itemId, quantity);
        updateCurrentOrderDisplay();
    }
}

// Mevcut sipariş gösterimini güncelle
function updateCurrentOrderDisplay() {
    const container = document.getElementById('currentOrderItems');
    const totalContainer = document.getElementById('currentOrderTotal');

    if (!orderManager.currentOrder || orderManager.currentOrder.items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Henüz ürün eklenmedi</p>';
        totalContainer.innerHTML = '<div class="order-total"><span class="total-label">Toplam:</span><span class="total-amount">0₺</span></div>';
        return;
    }

    let html = '';
    orderManager.currentOrder.items.forEach(item => {
        html += `
      <div class="order-item">
        <span><span class="item-quantity">${item.quantity}x</span> ${item.name}</span>
        <span>${item.price * item.quantity}₺</span>
      </div>
    `;
    });

    container.innerHTML = html;

    const total = orderManager.currentOrder.getTotal();
    totalContainer.innerHTML = `<div class="order-total"><span class="total-label">Toplam:</span><span class="total-amount">${total}₺</span></div>`;
}

// Sipariş oluştur
function handleCreateOrder() {
    if (!orderManager.currentOrder || orderManager.currentOrder.items.length === 0) {
        alert('Lütfen en az bir ürün ekleyin!');
        return;
    }

    orderManager.saveCurrentOrder();

    // Formu sıfırla
    document.getElementById('tableNumber').value = '';
    document.getElementById('currentOrderItems').innerHTML = '<p style="color: var(--text-muted); text-align: center;">Henüz ürün eklenmedi</p>';
    document.getElementById('currentOrderTotal').innerHTML = '<div class="order-total"><span class="total-label">Toplam:</span><span class="total-amount">0₺</span></div>';

    renderOrders();
    alert('Sipariş başarıyla oluşturuldu!');
}

// Siparişleri render et
function renderOrders() {
    const container = document.getElementById('ordersContainer');
    const orders = orderManager.getActiveOrders();

    if (orders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 30px;">Aktif sipariş bulunmuyor</p>';
        return;
    }

    let html = '';
    orders.forEach(order => {
        const statusClass = `status-${order.status}`;
        const statusText = {
            'pending': 'Beklemede',
            'preparing': 'Hazırlanıyor',
            'completed': 'Tamamlandı'
        }[order.status];

        html += `
      <div class="order-card">
        <div class="order-header">
          <span class="table-badge">Masa ${order.tableNumber}</span>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <span><span class="item-quantity">${item.quantity}x</span> ${item.name}</span>
              <span>${item.price * item.quantity}₺</span>
            </div>
          `).join('')}
        </div>
        <div class="order-total">
          <span class="total-label">Toplam:</span>
          <span class="total-amount">${order.getTotal()}₺</span>
        </div>
        <div class="order-actions">
          ${order.status === 'pending' ? `<button class="btn btn-primary btn-small" onclick="updateStatus(${order.id}, 'preparing')">Hazırlanıyor</button>` : ''}
          ${order.status === 'preparing' ? `<button class="btn btn-success btn-small" onclick="updateStatus(${order.id}, 'completed')">Tamamlandı</button>` : ''}
          <button class="btn btn-danger btn-small" onclick="deleteOrderConfirm(${order.id})">Sil</button>
        </div>
      </div>
    `;
    });

    container.innerHTML = html;
}

// Sipariş durumunu güncelle
function updateStatus(orderId, newStatus) {
    orderManager.updateOrderStatus(orderId, newStatus);
    renderOrders();
}

// Siparişi sil
function deleteOrderConfirm(orderId) {
    if (confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
        orderManager.deleteOrder(orderId);
        renderOrders();
    }
}
