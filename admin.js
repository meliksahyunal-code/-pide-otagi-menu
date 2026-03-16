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

// Helper function to determine if item is pide or beverage
function getItemType(itemId) {
    return itemId <= 7 ? 'pide' : 'beverage';
}

// Global state
let currentOrder = {
    tableNumber: '',
    items: []
};

let selectedPortion = 1;
let selectedPerson = 1;  // Currently selected person number
let maxPersonNumber = 5;  // Maximum person number shown (can grow)
let pendingItemId = null;

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

// ============= TABLE SELECTION LOGIC =============
function initTableSelection() {
    const modal = document.getElementById('tableMapModal');
    const openBtn = document.getElementById('openTableMapBtn');
    const closeBtn = document.querySelector('.table-modal-close');
    const overlay = document.querySelector('.table-modal-overlay');
    const tableButtons = document.querySelectorAll('.table-btn');
    const tableNumberInput = document.getElementById('tableNumber');
    const selectedTableText = document.getElementById('selectedTableText');

    openBtn.addEventListener('click', () => modal.classList.add('active'));

    const closeModal = () => modal.classList.remove('active');
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    tableButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tableNum = btn.dataset.table;
            tableButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            tableNumberInput.value = tableNum;
            selectedTableText.innerHTML = `📍 Masa ${tableNum}`;
            selectedTableText.classList.remove('placeholder');

            currentOrder.tableNumber = tableNum;

            setTimeout(() => {
                closeModal();
            }, 300);
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

    const isBeverage = item.id >= 8;

    selectedPortion = 1;
    selectedPerson = 1;

    document.querySelectorAll('.person-btn:not(.add-person-btn)').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.person === '1') {
            btn.classList.add('selected');
        }
    });

    document.querySelectorAll('.portion-btn').forEach(btn => {
        const portion = btn.dataset.portion;
        if (isBeverage && portion === '0.5') {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'block';
        }
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
        addItemToCurrentOrder(pendingItemId, selectedPortion, selectedPerson);
        closePortionModal();
        updateCurrentOrderDisplay();
    }
}

// ============= ORDER MANAGEMENT =============
function addItemToCurrentOrder(itemId, quantity, personNumber = 1) {
    const tableNumber = document.getElementById('tableNumber').value;
    if (!tableNumber) {
        alert('Lütfen önce masa numarası seçin!');
        return;
    }

    currentOrder.tableNumber = tableNumber;
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    currentOrder.items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity,
        personNumber: personNumber
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

    const itemsByPerson = {};
    let grandTotal = 0;

    currentOrder.items.forEach(item => {
        const personNum = item.personNumber || 1;
        if (!itemsByPerson[personNum]) {
            itemsByPerson[personNum] = { items: [], total: 0 };
        }
        const itemTotal = item.price * item.quantity;
        itemsByPerson[personNum].items.push({ ...item, itemTotal });
        itemsByPerson[personNum].total += itemTotal;
        grandTotal += itemTotal;
    });

    const sortedPersons = Object.keys(itemsByPerson).sort((a, b) => parseInt(a) - parseInt(b));
    let html = '';

    sortedPersons.forEach(personNum => {
        const personData = itemsByPerson[personNum];
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-left: 4px solid #667eea; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 600; color: #667eea; font-size: 1.1rem;">👤 Kişi ${personNum}</span>
                    <span style="font-weight: 600; color: var(--primary-gold);">${personData.total}₺</span>
                </div>
                <div style="margin-left: 10px;">
        `;

        personData.items.forEach(item => {
            html += `
                <div class="order-item" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span><span class="item-quantity">${item.quantity}x</span> ${item.name}</span>
                    <span>${item.itemTotal}₺</span>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
    totalContainer.innerHTML = `<div class="order-total"><span class="total-label">TOPLAM:</span><span class="total-amount">${grandTotal}₺</span></div>`;
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

    const saveButton = document.getElementById('createOrderBtn');
    const originalButtonText = saveButton.textContent;
    saveButton.textContent = '⏳ Kaydediliyor...';
    saveButton.disabled = true;
    saveButton.style.opacity = '0.6';
    saveButton.style.cursor = 'wait';

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableNumber: tableNumber,
                items: currentOrder.items
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Sipariş oluşturulamadı');
        }

        currentOrder = { tableNumber: '', items: [] };
        document.getElementById('tableNumber').value = '';
        document.getElementById('selectedTableText').innerHTML = 'Masa Seçin';
        document.getElementById('selectedTableText').classList.add('placeholder');
        updateCurrentOrderDisplay();

        showToast(`✅ Sipariş kaydedildi! 🖨️ Mutfak fişi yazıcıya gönderildi.`, 'success');

        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'tab-active-orders') {
            loadActiveOrders();
        }
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        alert(`Hata: ${error.message}`);
    } finally {
        saveButton.textContent = originalButtonText;
        saveButton.disabled = false;
        saveButton.style.opacity = '1';
        saveButton.style.cursor = 'pointer';
    }
}

// ============= AKTİF SİPARİŞ YÖNETİMİ =============
async function loadActiveOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/active`);
        if (!response.ok) throw new Error('Siparişler yüklenemedi');
        const orders = await response.json();
        displayActiveOrders(orders);
    } catch (error) {
        console.error('Sipariş yükleme hatası:', error);
        const container = document.getElementById('ordersContainer');
        if (container) container.innerHTML = '<p style="color:red;text-align:center;">Siparişler yüklenemedi.</p>';
    }
}

function displayActiveOrders(orders) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">Aktif sipariş yok ✓</p>';
        return;
    }

    const byTable = {};
    orders.forEach(o => {
        if (!byTable[o.tableNumber]) byTable[o.tableNumber] = [];
        byTable[o.tableNumber].push(o);
    });

    let html = '';
    Object.keys(byTable).sort().forEach(tableNum => {
        const tableOrders = byTable[tableNum];
        const tableTotal = tableOrders.reduce((s, o) =>
            s + o.items.reduce((ss, i) => ss + i.price * i.quantity, 0), 0);

        html += `
        <div style="background:var(--card-bg);border-radius:16px;padding:20px;
                    margin-bottom:20px;border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                <span style="background:var(--primary-gold);color:var(--bg-dark);
                             padding:8px 16px;border-radius:10px;font-weight:700;font-size:1.1rem;">
                    Masa ${tableNum}
                </span>
                <span style="color:var(--primary-gold);font-weight:700;font-size:1.1rem;">
                    ${tableTotal}₺
                </span>
            </div>
        `;

        tableOrders.forEach(order => {
            const orderTime = new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const printBadge = order.printed
                ? '<span style="color:#38ef7d;font-size:0.8rem;">🖨️ Fiş basıldı</span>'
                : '<span style="color:#f4a261;font-size:0.8rem;">⏳ Fiş bekleniyor</span>';

            html += `
            <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;margin-top:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div>
                        <span style="color:var(--text-muted);font-size:0.9rem;">⏰ ${orderTime}</span>
                        <span style="margin-left:12px;">${printBadge}</span>
                    </div>
                    <button onclick="cancelOrder('${order._id}')"
                        style="background:rgba(233,69,96,0.2);border:1px solid #e94560;
                               color:#e94560;border-radius:8px;padding:4px 12px;
                               cursor:pointer;font-size:0.85rem;">
                        ❌ İptal
                    </button>
                </div>
            `;

            const byPerson = {};
            order.items.forEach(item => {
                const p = item.personNumber || 1;
                if (!byPerson[p]) byPerson[p] = [];
                byPerson[p].push(item);
            });

            const multiPerson = Object.keys(byPerson).length > 1;
            const personColors = ['#667eea','#f093fb','#38ef7d','#f4a261','#e76f51'];

            Object.keys(byPerson).sort((a, b) => a - b).forEach((pNum, idx) => {
                const color = personColors[idx % personColors.length];
                if (multiPerson) {
                    html += `<div style="font-size:0.8rem;color:${color};margin-bottom:4px;font-weight:600;">Kişi ${pNum}</div>`;
                }
                byPerson[pNum].forEach(item => {
                    const emoji = item.id <= 7 ? '🍞' : '🥤';
                    html += `
                    <div style="display:flex;justify-content:space-between;
                                padding:6px 8px;border-radius:8px;
                                background:rgba(255,255,255,0.03);margin-bottom:4px;">
                        <span style="color:var(--text-light);">
                            ${emoji} ${item.quantity}x ${item.name}
                        </span>
                        <span style="color:var(--primary-gold);">${item.price * item.quantity}₺</span>
                    </div>`;
                });
            });

            html += '</div>';
        });

        html += '</div>';
    });

    container.innerHTML = html;
}

async function cancelOrder(orderId) {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Sipariş iptal edilemedi');
        showToast('❌ Sipariş iptal edildi', 'error');
        await loadActiveOrders();
    } catch (err) {
        alert('Hata: ' + err.message);
    }
}

// ============= STATISTICS DASHBOARD =============
let currentStatsPeriod = 'daily';

async function loadStatistics() {
    const period = currentStatsPeriod;
    try {
        let endpoint = period === 'monthly' ? '/api/statistics/monthly' : '/api/statistics/daily';
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error('İstatistikler yüklenemedi');

        const stats = await response.json();
        displayStatistics(stats);
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
    }
}

function displayStatistics(stats) {
    document.getElementById('stat-total-orders').textContent = stats.totalOrders || 0;
    document.getElementById('stat-total-revenue').textContent = `${stats.totalRevenue || 0}₺`;
    document.getElementById('stat-top-item').textContent = stats.mostPopularItem ? stats.mostPopularItem.name : '-';
    document.getElementById('stat-avg-order').textContent = `${stats.averageOrderValue || 0}₺`;

    displayTopItems(stats.itemBreakdown || [], stats.totalRevenue || 1);
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

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            if (targetTab === 'active-orders') {
                loadActiveOrders();
            } else if (targetTab === 'statistics') {
                loadStatistics();
            }
        });
    });
}

// ============= TOAST NOTIFICATIONS =============
function showToast(message, type = 'info') {
    const old = document.getElementById('toast-notification');
    if (old) old.remove();

    const colors = {
        success: 'linear-gradient(135deg, #11998e, #38ef7d)',
        error:   'linear-gradient(135deg, #e94560, #ff6b6b)',
        info:    'linear-gradient(135deg, #667eea, #764ba2)'
    };

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        background: ${colors[type] || colors.info}; color: white;
        padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 0.95rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 9999; max-width: 400px;
        transition: opacity 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    initTableSelection();
    renderMenu();
    initTabNavigation();

    // Portion modal event listeners
    document.querySelectorAll('.portion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.portion-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPortion = parseFloat(btn.dataset.portion);
        });
    });

    document.querySelectorAll('.person-btn:not(.add-person-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.person-btn:not(.add-person-btn)').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPerson = parseInt(btn.dataset.person);
        });
    });

    document.getElementById('addPersonBtn').addEventListener('click', () => {
        maxPersonNumber++;
        const personButtonsContainer = document.getElementById('personButtons');
        const addButton = document.getElementById('addPersonBtn');

        const newButton = document.createElement('button');
        newButton.className = 'person-btn';
        newButton.dataset.person = maxPersonNumber;
        newButton.textContent = `Kişi ${maxPersonNumber}`;

        newButton.addEventListener('click', () => {
            document.querySelectorAll('.person-btn:not(.add-person-btn)').forEach(b => b.classList.remove('selected'));
            newButton.classList.add('selected');
            selectedPerson = maxPersonNumber;
        });

        personButtonsContainer.insertBefore(newButton, addButton);

        document.querySelectorAll('.person-btn:not(.add-person-btn)').forEach(b => b.classList.remove('selected'));
        newButton.classList.add('selected');
        selectedPerson = maxPersonNumber;
    });

    document.getElementById('confirmPortion').addEventListener('click', confirmPortionSelection);
    document.getElementById('cancelPortion').addEventListener('click', closePortionModal);
    document.querySelector('.modal-overlay').addEventListener('click', closePortionModal);

    document.getElementById('createOrderBtn').addEventListener('click', createOrder);

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatsPeriod = btn.dataset.period;
            loadStatistics();
        });
    });

    const refreshActiveOrdersBtn = document.getElementById('refreshActiveOrdersBtn');
    if (refreshActiveOrdersBtn) {
        refreshActiveOrdersBtn.addEventListener('click', loadActiveOrders);
    }

    loadActiveOrders();

    setInterval(() => {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'tab-active-orders') {
            loadActiveOrders();
        }
    }, 600000); // Keep alive
});
