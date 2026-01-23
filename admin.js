// Menü verileri - menu.js ile senkronize edildi
const menuData = {
    pides: [
        { id: 1, name: "Çökelekli Pide", price: 130 },
        { id: 2, name: "Kıymalı Pide", price: 150 },
        { id: 3, name: "Kuşbaşılı Pide", price: 200 },
        { id: 4, name: "Patatesli Pide", price: 130 },
        { id: 5, name: "Karışık Pide", price: 170 },
        { id: 6, name: "Kuşbaşı Kaşarlı Pide", price: 230 },
        { id: 7, name: "Kıymalı Kaşarlı Pide", price: 180 }
    ],
    drinks: [
        { id: 8, name: "Ayran", price: 25 },
        { id: 9, name: "Kola Kutu", price: 60 },
        { id: 10, name: "Kola Şişe", price: 40 },
        { id: 11, name: "Meyve Suyu", price: 60 },
        { id: 12, name: "Gazoz", price: 60 },
        { id: 13, name: "İcetea", price: 60 },
        { id: 14, name: "Su", price: 15 },
        { id: 15, name: "Double Çay", price: 20 },
        { id: 16, name: "Şalgam", price: 35 },
        { id: 17, name: "Maden Suyu", price: 40 }
    ]
};

// Tüm ürünleri tek array'de birleştir
const allItems = [...menuData.pides, ...menuData.drinks];

// Global state
let currentOrder = {
    tableNumber: '',
    items: []
};

let selectedPortion = 1;
let pendingItemId = null;

// ============= TABLE SELECTION LOGIC =============
function initTableSelection() {
    const tableCards = document.querySelectorAll('.table-card');
    const tableNumberInput = document.getElementById('tableNumber');
    const tableDisplay = document.getElementById('selectedTableDisplay');

    tableCards.forEach(card => {
        card.addEventListener('click', () => {
            const tableNum = card.dataset.table;

            // Remove selected class from all cards
            tableCards.forEach(c => c.classList.remove('selected'));

            // Add selected class to clicked card
            card.classList.add('selected');

            // Update hidden input and display
            tableNumberInput.value = tableNum;
            tableDisplay.innerHTML = `<span style="color: var(--primary-gold); font-size: 1.5rem;">📍 Masa ${tableNum}</span>`;

            // Update current order table number
            currentOrder.tableNumber = tableNum;

            console.log(`Table ${tableNum} selected`);
        });
    });
}


// ============= PORTION MODAL LOGIC =============
function openPortionModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    pendingItemId = itemId;

    const modal = document.getElementById('portionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');

    modalTitle.textContent = 'Porsiyon Seçin';
    modalSubtitle.textContent = `${item.name} - ${item.price}₺/porsiyon`;

    // Check if item is a beverage (id >= 8)
    const isBeverage = item.id >= 8;

    // Reset selection to 1
    selectedPortion = 1;
    document.querySelectorAll('.portion-btn').forEach(btn => {
        const portion = btn.dataset.portion;

        // Hide 0.5 for beverages
        if (isBeverage && portion === '0.5') {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'block';
        }

        // Select default
        btn.classList.remove('selected');
        if (portion === '1') {
            btn.classList.add('selected');
        }
    });

    modal.classList.add('active');
}

function closePortionModal() {
    const modal = document.getElementById('portionModal');
    modal.classList.remove('active');
    pendingItemId = null;
    selectedPortion = 1;
}

function confirmPortionSelection() {
    if (pendingItemId !== null) {
        addItemToCurrentOrder(pendingItemId, selectedPortion);
        closePortionModal();
        updateCurrentOrderDisplay();
    }
}

// ============= ORDER MANAGEMENT =============
function addItemToCurrentOrder(itemId, quantity) {
    const tableNumber = document.getElementById('tableNumber').value;

    if (!tableNumber) {
        alert('Lütfen önce masa numarası seçin!');
        return;
    }

    currentOrder.tableNumber = tableNumber;

    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    // CRITICAL: Do NOT combine items with same ID
    // Each add creates a separate line for kitchen to see individual orders
    // Example: Person A orders 1.5x, Person B orders 0.5x = 2 separate lines
    currentOrder.items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity
    });
}

function updateCurrentOrderDisplay() {
    const container = document.getElementById('currentOrderItems');
    const totalContainer = document.getElementById('currentOrderTotal');

    if (!currentOrder.items || currentOrder.items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Henüz ürün eklenmedi</p>';
        totalContainer.innerHTML = '<div class="order-total"><span class="total-label">Toplam:</span><span class="total-amount">0₺</span></div>';
        return;
    }

    let html = '';
    let total = 0;

    currentOrder.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
      <div class="order-item">
        <span><span class="item-quantity">${item.quantity}x</span> ${item.name}</span>
        <span>${itemTotal}₺</span>
      </div>
    `;
    });

    container.innerHTML = html;
    totalContainer.innerHTML = `<div class="order-total"><span class="total-label">Toplam:</span><span class="total-amount">${total}₺</span></div>`;
}

async function createOrder() {
    const tableNumber = document.getElementById('tableNumber').value;

    if (!tableNumber) {
        alert('Lütfen masa numarası seçin!');
        return;
    }

    if (!currentOrder.items || currentOrder.items.length === 0) {
        alert('Sipariş boş! Lütfen ürün ekleyin.');
        return;
    }

    // Get the button and show loading state
    const saveButton = document.getElementById('createOrderBtn');
    const originalButtonText = saveButton.textContent;
    saveButton.textContent = '⏳ Kaydediliyor...';
    saveButton.disabled = true;
    saveButton.style.opacity = '0.6';
    saveButton.style.cursor = 'wait';

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tableNumber: tableNumber,
                items: currentOrder.items
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Sipariş oluşturulamadı');
        }

        const order = await response.json();

        // Reset current order
        currentOrder = {
            tableNumber: '',
            items: []
        };
        document.getElementById('tableNumber').value = '';
        updateCurrentOrderDisplay();

        alert('Sipariş başarıyla kaydedildi!');

        // Refresh active orders if on that tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'tab-active-orders') {
            loadActiveOrders();
        }
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        alert(`Hata: ${error.message}`);
    } finally {
        // Reset button state
        saveButton.textContent = originalButtonText;
        saveButton.disabled = false;
        saveButton.style.opacity = '1';
        saveButton.style.cursor = 'pointer';
    }
}

// ============= ACTIVE ORDERS MANAGEMENT =============
async function loadActiveOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/active`);
        if (!response.ok) throw new Error('Siparişler yüklenemedi');

        const orders = await response.json();
        displayActiveOrders(orders);
    } catch (error) {
        console.error('Sipariş yükleme hatası:', error);
        document.getElementById('ordersContainer').innerHTML =
            '<p style="color: red; text-align: center;">Siparişler yüklenemedi. Sunucuya bağlanılamıyor.</p>';
    }
}

function displayActiveOrders(orders) {
    const container = document.getElementById('ordersContainer');

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Henüz aktif sipariş yok</p>';
        return;
    }

    let html = '';

    // Group orders by table
    const ordersByTable = {};
    orders.forEach(order => {
        if (!ordersByTable[order.tableNumber]) {
            ordersByTable[order.tableNumber] = [];
        }
        ordersByTable[order.tableNumber].push(order);
    });

    // Display orders grouped by table
    Object.entries(ordersByTable).forEach(([tableNum, tableOrders]) => {
        tableOrders.forEach(order => {
            const statusText = getStatusText(order.status);
            const statusClass = getStatusClass(order.status);
            const total = order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            html += `
        <div class="order-card ${statusClass}">
          <div class="order-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="checkbox" class="order-checkbox" data-order-id="${order._id}" style="width: 20px; height: 20px; cursor: pointer;">
              <span class="table-badge">Masa ${order.tableNumber}</span>
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
          <div class="order-actions">
            ${getOrderActionButtons(order)}
          </div>
        </div>
      `;
        });
    });

    container.innerHTML = html;

    // Add event listeners to action buttons
    attachOrderActionListeners();
}

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

function getStatusClass(status) {
    return `order-status-${status}`;
}

function getOrderActionButtons(order) {
    const tableNumber = order.tableNumber;
    const showTablePayment = true;

    let buttons = '';

    // Debug log
    console.log('Getting buttons for order:', order._id, 'status:', order.status);

    // Waiter can only mark as "Teslim Edildi" when status is "ready"
    if (order.status === 'pending' || order.status === 'preparing') {
        buttons += `
      <div style="text-align: center; color: var(--text-muted); padding: 10px;">
        ⏳ Mutfakta hazırlanıyor...
      </div>
      <button class="btn btn-danger btn-sm" onclick="cancelOrder('${order._id}')">
        ❌ İptal Et
      </button>
    `;
    } else if (order.status === 'ready') {
        buttons += `
      <button class="btn btn-success btn-sm" onclick="updateOrderStatus('${order._id}', 'delivered')" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); animation: pulse 2s infinite;">
        🍽️ Teslim Edildi (Masaya Götür)
      </button>
      <button class="btn btn-danger btn-sm" onclick="cancelOrder('${order._id}')">
        ❌ İptal Et
      </button>
    `;
    } else if (order.status === 'delivered') {
        buttons += `
      <button class="btn btn-success btn-sm" disabled>
        ✓ Teslim Edildi
      </button>
      <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${order._id}', 'paid')">
        ✅ Ödendi
      </button>
    `;
    } else if (order.status === 'cancelled') {
        buttons += '<span style="color: var(--text-muted);">İptal edilmiş sipariş</span>';
    } else if (order.status === 'paid') {
        buttons += '<span style="color: var(--success);">✓ Ödeme tamamlandı</span>';
    }

    // Add table-wide payment button
    if (showTablePayment && (order.status === 'ready' || order.status === 'delivered')) {
        buttons += `
      <button class="btn btn-warning btn-table-pay" onclick="payAllTableOrders('${tableNumber}')">
        💰 Masa Tamamen Ödendi
      </button>
    `;
    }

    console.log('Generated buttons:', buttons);
    return buttons;
}

function attachOrderActionListeners() {
    // Listeners are handled by onclick attributes for simplicity
}

async function updateOrderStatus(orderId, newStatus) {
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

        await loadActiveOrders();

        // Refresh statistics if on that tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'tab-statistics') {
            loadStatistics();
        }
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        alert(`Hata: ${error.message}`);
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) {
        return;
    }

    await updateOrderStatus(orderId, 'cancelled');
}

async function payAllTableOrders(tableNumber) {
    if (!confirm(`Masa ${tableNumber}'teki tüm siparişler ödenmiş olarak işaretlenecek. Onaylıyor musunuz?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/tables/${tableNumber}/pay-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ödeme işlemi başarısız');
        }

        const result = await response.json();
        alert(result.message);
        await loadActiveOrders();

        // Refresh statistics if on that tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'tab-statistics') {
            loadStatistics();
        }
    } catch (error) {
        console.error('Toplu ödeme hatası:', error);
        alert(`Hata: ${error.message}`);
    }
}

// ============= STATISTICS DASHBOARD =============
let currentStatsPeriod = 'daily';

async function loadStatistics() {
    const period = currentStatsPeriod;

    try {
        let endpoint = '';
        if (period === 'daily') {
            endpoint = '/api/statistics/daily';
        } else if (period === 'weekly') {
            // For weekly, we'll use daily with last 7 days
            endpoint = '/api/statistics/daily';
        } else if (period === 'monthly') {
            endpoint = '/api/statistics/monthly';
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error('İstatistikler yüklenemedi');

        const stats = await response.json();
        displayStatistics(stats);
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
        document.getElementById('stat-total-orders').textContent = 'Hata';
        document.getElementById('stat-total-revenue').textContent = 'Hata';
        document.getElementById('stat-top-item').textContent = 'Hata';
        document.getElementById('stat-avg-order').textContent = 'Hata';
    }
}

function displayStatistics(stats) {
    // Update summary cards
    document.getElementById('stat-total-orders').textContent = stats.totalOrders || 0;
    document.getElementById('stat-total-revenue').textContent = `${stats.totalRevenue || 0}₺`;
    document.getElementById('stat-top-item').textContent = stats.mostPopularItem ? stats.mostPopularItem.name : '-';
    document.getElementById('stat-avg-order').textContent = `${stats.averageOrderValue || 0}₺`;

    // Update top items table
    displayTopItems(stats.itemBreakdown || [], stats.totalRevenue || 1);

    // Update status breakdown
    displayStatusBreakdown(stats.statusBreakdown || {});
}

function displayTopItems(items, totalRevenue) {
    const tbody = document.getElementById('top-items-tbody');

    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Henüz veri yok</td></tr>';
        return;
    }

    let html = '';
    items.forEach((item, index) => {
        const percentage = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
        html += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.count.toFixed(1)}</td>
        <td>${item.revenue}₺</td>
        <td>${percentage}%</td>
      </tr>
    `;
    });

    tbody.innerHTML = html;
}

function displayStatusBreakdown(statusBreakdown) {
    const container = document.getElementById('status-breakdown');

    const statuses = [
        { key: 'pending', label: 'Bekliyor', icon: '⏳', color: '#f4a261' },
        { key: 'preparing', label: 'Hazırlanıyor', icon: '👨‍🍳', color: '#e9c46a' },
        { key: 'ready', label: 'Hazır', icon: '✅', color: '#38ef7d' },
        { key: 'delivered', label: 'Teslim Edildi', icon: '✅', color: '#2a9d8f' },
        { key: 'paid', label: 'Ödendi', icon: '💰', color: '#264653' },
        { key: 'cancelled', label: 'İptal', icon: '❌', color: '#e76f51' }
    ];

    let html = '';
    statuses.forEach(status => {
        const count = statusBreakdown[status.key] || 0;
        html += `
      <div class="status-card" style="border-left: 4px solid ${status.color}">
        <div class="status-icon">${status.icon}</div>
        <div class="status-label">${status.label}</div>
        <div class="status-count">${count}</div>
      </div>
    `;
    });

    container.innerHTML = html;
}

// ============= TAB NAVIGATION =============
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Load data based on tab
            if (targetTab === 'active-orders') {
                loadActiveOrders();
            } else if (targetTab === 'statistics') {
                loadStatistics();
            }
        });
    });
}

// ============= MENU RENDERING =============
function renderMenu() {
    const menuSelection = document.getElementById('menuSelection');

    let html = '<h3>Pideler</h3><div class="menu-grid">';
    menuData.pides.forEach(item => {
        html += `
      <div class="menu-item" data-item-id="${item.id}">
        <span class="item-name">${item.name}</span>
        <span class="item-price">${item.price}₺</span>
      </div>
    `;
    });
    html += '</div>';

    html += '<h3 style="margin-top: 30px;">İçecekler</h3><div class="menu-grid">';
    menuData.drinks.forEach(item => {
        html += `
      <div class="menu-item" data-item-id="${item.id}">
        <span class="item-name">${item.name}</span>
        <span class="item-price">${item.price}₺</span>
      </div>
    `;
    });
    html += '</div>';

    menuSelection.innerHTML = html;

    // Add click listeners to menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const itemId = parseInt(item.dataset.itemId);
            openPortionModal(itemId);
        });
    });
}

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    // Initialize table selection
    initTableSelection();

    // Initialize menu
    renderMenu();

    // Initialize tab navigation
    initTabNavigation();

    // Portion modal event listeners
    document.querySelectorAll('.portion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.portion-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPortion = parseFloat(btn.dataset.portion);
        });
    });

    document.getElementById('confirmPortion').addEventListener('click', confirmPortionSelection);
    document.getElementById('cancelPortion').addEventListener('click', closePortionModal);

    document.querySelector('.modal-overlay').addEventListener('click', closePortionModal);

    // Create order button
    document.getElementById('createOrderBtn').addEventListener('click', createOrder);

    // Period selector for statistics
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatsPeriod = btn.dataset.period;
            loadStatistics();
        });
    });

    // Clear test data button
    const clearTestDataBtn = document.getElementById('clearTestDataBtn');
    if (clearTestDataBtn) {
        clearTestDataBtn.addEventListener('click', async () => {
            const confirmation = confirm(
                '⚠️ DİKKAT!\n\n' +
                'Bu işlem TÜM siparişleri kalıcı olarak silecektir.\n' +
                'Bu işlem geri alınamaz!\n\n' +
                'Devam etmek istediğinizden emin misiniz?'
            );

            if (!confirmation) return;

            // Double confirmation for safety
            const doubleCheck = prompt(
                'Onaylamak için "SİL" yazın (büyük harflerle):'
            );

            if (doubleCheck !== 'SİL') {
                alert('İşlem iptal edildi.');
                return;
            }

            try {
                // Get all orders
                const response = await fetch(`${API_BASE_URL}/api/orders`);
                if (!response.ok) throw new Error('Siparişler yüklenemedi');

                const orders = await response.json();

                // Delete each order
                let deletedCount = 0;
                for (const order of orders) {
                    try {
                        const deleteResponse = await fetch(`${API_BASE_URL}/api/orders/${order._id}`, {
                            method: 'DELETE'
                        });
                        if (deleteResponse.ok) deletedCount++;
                    } catch (err) {
                        console.error(`Sipariş silinemedi: ${order._id}`, err);
                    }
                }

                alert(`✅ ${deletedCount} sipariş başarıyla silindi!`);

                // Refresh displays
                loadActiveOrders();
                loadStatistics();
            } catch (error) {
                console.error('Toplu silme hatası:', error);
                alert(`❌ Hata: ${error.message}`);
            }
        });
    }

    // Select all orders checkbox
    const selectAllCheckbox = document.getElementById('selectAllOrders');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.order-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateDeleteButtonVisibility();
        });
    }

    // Delete selected orders button
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.order-checkbox:checked');
            const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.orderId);

            if (selectedIds.length === 0) {
                alert('Lütfen silmek için sipariş seçin');
                return;
            }

            const confirmation = confirm(
                `${selectedIds.length} sipariş silinecek. Emin misiniz?`
            );

            if (!confirmation) return;

            try {
                let deletedCount = 0;
                for (const orderId of selectedIds) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) deletedCount++;
                    } catch (err) {
                        console.error(`Silme hatası: ${orderId}`, err);
                    }
                }

                alert(`✅ ${deletedCount} sipariş silindi!`);
                loadActiveOrders();
                loadStatistics();

                if (selectAllCheckbox) selectAllCheckbox.checked = false;
            } catch (error) {
                console.error('Toplu silme hatası:', error);
                alert(`❌ Hata: ${error.message}`);
            }
        });
    }

    // Load active orders on initial load
    loadActiveOrders();

    // Auto-refresh active orders every 10 minutes to keep backend awake
    // This prevents Render free tier from sleeping (sleeps after 15 min of inactivity)
    setInterval(() => {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'tab-active-orders') {
            console.log('🔄 Auto-refreshing orders to keep backend awake...');
            loadActiveOrders();
        }
    }, 600000); // 10 minutes = 600,000 milliseconds
});

// Helper function to show/hide delete button based on selection
function updateDeleteButtonVisibility() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const selectedCheckboxes = document.querySelectorAll('.order-checkbox:checked');

    if (deleteBtn) {
        deleteBtn.style.display = selectedCheckboxes.length > 0 ? 'block' : 'none';
    }
}

// Add listener to checkboxes after orders load
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('order-checkbox')) {
        updateDeleteButtonVisibility();
    }
});
