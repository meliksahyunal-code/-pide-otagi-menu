// Kitchen Panel JavaScript

let currentFilter = 'all';
let orders = [];

// Load orders from API
async function loadKitchenOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/active`);
        if (!response.ok) throw new Error('Siparişler yüklenemedi');

        orders = await response.json();
        displayKitchenOrders();
        updateOrderCount();
    } catch (error) {
        console.error('Sipariş yükleme hatası:', error);
        document.getElementById('kitchenOrders').innerHTML =
            '<p style="color: red; text-align: center;">Siparişler yüklenemedi. Sunucuya bağlanılamıyor.</p>';
    }
}

// Display orders based on filter
function displayKitchenOrders() {
    const container = document.getElementById('kitchenOrders');

    let filteredOrders = orders;
    if (currentFilter !== 'all') {
        filteredOrders = orders.filter(o => o.status === currentFilter);
    }

    if (!filteredOrders || filteredOrders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Gösterilecek sipariş yok</p>';
        return;
    }

    // Group by table
    const ordersByTable = {};
    filteredOrders.forEach(order => {
        if (!ordersByTable[order.tableNumber]) {
            ordersByTable[order.tableNumber] = [];
        }
        ordersByTable[order.tableNumber].push(order);
    });

    let html = '';
    Object.entries(ordersByTable).forEach(([tableNum, tableOrders]) => {
        tableOrders.forEach(order => {
            const statusText = getStatusText(order.status);
            const statusClass = getStatusClass(order.status);
            const total = order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Calculate time since order
            const timeSince = getTimeSince(order.createdAt);

            html += `
        <div class="order-card ${statusClass}">
          <div class="order-header">
            <div>
              <span class="table-badge">Masa ${order.tableNumber}</span>
              <span style="color: var(--text-muted); font-size: 0.9rem; margin-left: 10px;">⏱️ ${timeSince}</span>
            </div>
            <span class="status-badge">${statusText}</span>
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
          <div class="kitchen-actions">
            ${getKitchenActionButtons(order)}
          </div>
        </div>
      `;
        });
    });

    container.innerHTML = html;
}

// Get status text in Turkish
function getStatusText(status) {
    const statusMap = {
        'pending': 'Bekliyor',
        'preparing': 'Hazırlanıyor',
        'ready': '✅ Hazır',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi',
        'paid': 'Ödendi'
    };
    return statusMap[status] || status;
}

// Get status class for styling
function getStatusClass(status) {
    return `order-status-${status}`;
}

// Get time since order was created
function getTimeSince(createdAt) {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}s ${mins}dk önce`;
}

// Get kitchen action buttons based on order status
function getKitchenActionButtons(order) {
    if (order.status === 'pending') {
        return `
      <button class="btn btn-primary" onclick="updateStatus('${order._id}', 'preparing')">
        👨‍🍳 Hazırlamaya Başla
      </button>
    `;
    }

    if (order.status === 'preparing') {
        return `
      <button class="btn btn-success" onclick="updateStatus('${order._id}', 'ready')">
        ✅ Hazır
      </button>
    `;
    }

    if (order.status === 'ready') {
        return `
      <div style="text-align: center; color: var(--success); font-weight: 600;">
        ✅ Garson bekleniyor...
      </div>
    `;
    }

    return '<span style="color: var(--text-muted);">-</span>';
}

// Update order status
async function updateStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Durum güncellenemedi');
        }

        // Play sound for ready status
        if (newStatus === 'ready') {
            playNotificationSound();
        }

        await loadKitchenOrders();
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        alert(`Hata: ${error.message}`);
    }
}

// Update order count badge
function updateOrderCount() {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const orderCountBadge = document.getElementById('orderCount');

    if (orderCountBadge) {
        if (pendingCount === 0) {
            orderCountBadge.textContent = 'Bekleyen Sipariş Yok ✓';
            orderCountBadge.style.background = '#2a9d8f';
        } else {
            orderCountBadge.textContent = `${pendingCount} Bekleyen Sipariş`;
            orderCountBadge.style.background = '#e94560';
        }
    }
}

// Play notification sound
function playNotificationSound() {
    // Simple beep using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load orders immediately
    loadKitchenOrders();

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            displayKitchenOrders();
        });
    });

    // Auto-refresh every 10 seconds
    // This also keeps the Render backend awake during kitchen hours
    setInterval(() => {
        console.log('🔄 Kitchen: Auto-refreshing orders...');
        loadKitchenOrders();
    }, 10000);
});
