// Menü verileri - menu.js ile senkronize edildi
const menuData = {
    pides: [
        { id: 1, name: "Çökeleği Pide", price: 130 },
        { id: 2, name: "Kıymalı Pide", price: 140 },
        { id: 3, name: "Kuşbaşılı Pide", price: 200 },
        { id: 4, name: "Patatesli Pide", price: 130 },
        { id: 5, name: "Karışık Pide", price: 230 },
        { id: 6, name: "Kuşbaşı Kaşarlı Pide", price: 230 },
        { id: 7, name: "Kıymalı Kaşarlı Pide", price: 180 }
    ],
    drinks: [
        { id: 8, name: "Ayran", price: 25 },
        { id: 9, name: "Kola Kutu", price: 25 },
        { id: 10, name: "Kola Şişe", price: 40 },
        { id: 11, name: "Gazlı İçecek", price: 40 },
        { id: 12, name: "Meyve Suyu", price: 60 },
        { id: 13, name: "Fanta Suyu", price: 30 },
        { id: 14, name: "Gazoz", price: 30 },
        { id: 15, name: "İcetea", price: 30 },
        { id: 16, name: "Su", price: 17 },
        { id: 17, name: "Doğal Çay", price: 20 }
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

// Başarı mesajı göster (otomatik kaybolur)
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // 2 saniye sonra otomatik kaldır
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 2000);
}

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

    // Porsiyon seçimi: 0.5, 1, veya 1.5 (virgül veya nokta ile)
    const quantityStr = prompt('Porsiyon miktarı (0.5, 1, veya 1.5):', '1');
    // Türkçe virgül kullanımını destekle (1,5 => 1.5)
    const quantity = parseFloat(quantityStr.replace(',', '.')) || 1;

    // Sadece 0.5, 1, 1.5 ve tam sayı değerlerine izin ver
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
async function handleCreateOrder() {
    console.log('=== SIPARIŞ OLUŞTURMA BAŞLADI ===');
    console.log('API_CONFIG:', typeof API_CONFIG !== 'undefined' ? API_CONFIG : 'UNDEFINED!!!');

    if (!orderManager.currentOrder || orderManager.currentOrder.items.length === 0) {
        alert('Lütfen en az bir ürün ekleyin!');
        return;
    }

    // Backend'e gönder
    try {
        // Total hesapla - güvenli yöntem
        let calculatedTotal = 0;
        try {
            calculatedTotal = orderManager.currentOrder.getTotal();
        } catch (e) {
            console.error('getTotal() hatası, manuel hesaplama yapılıyor:', e);
            calculatedTotal = orderManager.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        console.log('Hesaplanan total:', calculatedTotal);

        const orderData = {
            tableNumber: orderManager.currentOrder.tableNumber,
            items: orderManager.currentOrder.items,
            total: calculatedTotal,
            status: 'pending'
        };

        console.log('Sipariş verisi:', orderData);
        console.log('Backend URL:', typeof API_CONFIG !== 'undefined' ? API_CONFIG.API_URL : 'API_CONFIG TANIMSIZ!');

        const apiUrl = typeof API_CONFIG !== 'undefined' ? API_CONFIG.API_URL : 'https://pide-otagi-menu.onrender.com/api';
        console.log('Kullanılacak API URL:', apiUrl);

        const response = await fetch(`${apiUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        console.log('Backend yanıt durumu:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend hatası:', errorText);
            throw new Error('Sipariş kaydedilemedi: ' + response.status);
        }

        const savedOrder = await response.json();
        console.log('Sipariş backend\'e kaydedildi:', savedOrder);

        // localStorage'a da kaydet (fallback)
        orderManager.saveCurrentOrder();

        // Formu sıfırla
        document.getElementById('tableNumber').value = '';
        document.getElementById('currentOrderItems').innerHTML = '<p style="color: var(--text-muted); text-align: center;">Henüz ürün eklenmedi</p>';
        document.getElementById('currentOrderTotal').innerHTML = '<div class="order-total"><span class="total-label">Toplam:</span><span class="total-amount">0₺</span></div>';

        renderOrders();

        // Başarı mesajı göster (otomatik kaybolur)
        showSuccessMessage('Sipariş başarıyla oluşturuldu!');

    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);

        // Hata olursa localStorage'a kaydet
        orderManager.saveCurrentOrder();

        // Formu sıfırla
        document.getElementById('tableNumber').value = '';
        document.getElementById('currentOrderItems').innerHTML = '<p style="color: var(--text-muted); text-align: center;">Henüz ürün eklenmedi</p>';
        document.getElementById('currentOrderTotal').innerHTML = '<div class="order-total"><span class="total-label">Toplam:</span><span class="total-amount">0₺</span></div>';

        renderOrders();
        alert('Sipariş oluşturuldu (yerel kayıt)');
    }
}

// Siparişleri render et
async function renderOrders() {
    console.log('=== RENDERİNG ORDERS ===');
    const container = document.getElementById('ordersContainer');

    try {
        // Backend'den siparişleri çek
        const apiUrl = typeof API_CONFIG !== 'undefined' ? API_CONFIG.API_URL : 'https://pide-otagi-menu.onrender.com/api';
        console.log('Siparişler için API URL:', apiUrl);

        const response = await fetch(`${apiUrl}/orders/active`);
        console.log('Siparişler yanıt durumu:', response.status);

        if (!response.ok) {
            throw new Error('Siparişler yüklenemedi');
        }

        const orders = await response.json();
        console.log('Backend\'den alınan siparişler:', orders);

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

            // Toplam hesapla
            const total = order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
              <span class="total-amount">${total}₺</span>
            </div>
            <div class="order-actions">
              ${order.status === 'pending' ? `<button class="btn btn-primary btn-small" onclick="updateStatus('${order._id}', 'preparing')">Hazırlanıyor</button>` : ''}
              ${order.status === 'preparing' ? `<button class="btn btn-success btn-small" onclick="updateStatus('${order._id}', 'completed')">Tamamlandı</button>` : ''}
              <button class="btn btn-danger btn-small" onclick="deleteOrderConfirm('${order._id}')">Sil</button>
            </div>
          </div>
        `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Siparişleri yükleme hatası:', error);

        // Hata olursa localStorage'dan yükle
        const orders = orderManager.getActiveOrders();

        if (orders.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 30px;">Aktif sipariş bulunmuyor (çevrimdışı mod)</p>';
            return;
        }

        let html = '';
        orders.forEach(order => {
            const statusClass = `status-${order.status}`;
            const statusText = {
                'pending': 'Beklemede',
                'preparing': 'Hazırlanıyor',
                'ready': 'Hazır',
                'delivered': 'Teslim Edildi',
                'completed': 'Tamamlandı'
            }[order.status];

            // Safely calculate total - handle both Order instances and plain objects from localStorage
            const total = order.total || (order.items && order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)) || 0;

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
              <span class="total-amount">${total}₺</span>
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
}

// Sipariş durumunu güncelle
async function updateStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_CONFIG.API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Durum güncellenemedi');
        }

        console.log('Sipariş durumu güncellendi');
        renderOrders();

    } catch (error) {
        console.error('Durum güncelleme hatası:', error);

        // Hata olursa localStorage kullan
        orderManager.updateOrderStatus(orderId, newStatus);
        renderOrders();
    }
}

// Siparişi sil
async function deleteOrderConfirm(orderId) {
    if (!confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${API_CONFIG.API_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Sipariş silinemedi');
        }

        console.log('Sipariş silindi');
        renderOrders();

    } catch (error) {
        console.error('Silme hatası:', error);

        // Hata olursa localStorage kullan
        orderManager.deleteOrder(orderId);
        renderOrders();
    }
}
