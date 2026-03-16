// Pide Otağı - Mutfak Paneli (Yalnızca Görüntüleme)

let currentCategory = 'all'; // 'all', 'pides', 'beverages'
let orders = [];

// Helper function to determine if item is pide or beverage
function getItemType(itemId) {
    return itemId <= 7 ? 'pide' : 'beverage';
}

// Helper function to group and display items by person for kitchen
function generatePersonGroupedItemsForKitchen(items) {
    const byPerson = {};
    items.forEach(item => {
        const personNum = item.personNumber || 1;
        if (!byPerson[personNum]) {
            byPerson[personNum] = [];
        }
        byPerson[personNum].push(item);
    });

    if (Object.keys(byPerson).length === 1 && byPerson[1]) {
        return items.map(item => `
            <div class="order-item">
                <span>
                    ${getItemType(item.id) === 'pide' ? '🍞' : '🥤'}
                    <span class="item-quantity">${item.quantity}x</span> ${item.name}
                </span>
            </div>
        `).join('');
    }

    const personColors = ['#667eea', '#f093fb', '#38ef7d', '#f4a261', '#e76f51'];
    let html = '';
    Object.keys(byPerson).sort((a, b) => parseInt(a) - parseInt(b)).forEach((personNum, index) => {
        const color = personColors[index % personColors.length];
        const personItems = byPerson[personNum];

        personItems.forEach(item => {
            html += `
                <div class="order-item">
                    <span>
                        <span style="background: ${color}; color: white; padding: 3px 10px; border-radius: 15px; font-size: 0.85rem; margin-right: 8px; font-weight: 700;">Kişi ${personNum}</span>
                        ${getItemType(item.id) === 'pide' ? '🍞' : '🥤'}
                        <span class="item-quantity">${item.quantity}x</span> ${item.name}
                    </span>
                </div>
            `;
        });
    });

    return html;
}

// Load ACTIVE orders from API (sadece pending olanlar çekilir)
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

// Display orders based on category
function displayKitchenOrders() {
    const container = document.getElementById('kitchenOrders');

    // Mutfak panelinde sadece "pending" siparişler gösterileceği için ekstra durum filtresine gerek yok
    let filteredOrders = orders;

    if (!filteredOrders || filteredOrders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 1.2rem; padding: 40px;">Takip edilecek sipariş yok ✓</p>';
        return;
    }

    // Filter by category
    if (currentCategory !== 'all') {
        filteredOrders = filteredOrders.map(order => {
            const filteredItems = order.items.filter(item => {
                const itemType = getItemType(item.id);
                return currentCategory === 'pides' ? itemType === 'pide' : itemType === 'beverage';
            });
            return filteredItems.length > 0 ? { ...order, items: filteredItems } : null;
        }).filter(order => order !== null);
    }

    if (!filteredOrders || filteredOrders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">Bu kategoride sipariş yok</p>';
        return;
    }

    // Sort by oldest first (ilk gelen ilk gösterilir)
    filteredOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let html = '';
    filteredOrders.forEach(order => {
        const timeSince = getTimeSince(order.createdAt);
        const orderTime = new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        // Fiş durumu rozeti
        const printBadge = order.printed 
            ? '<span style="color:#38ef7d; font-size: 0.8rem; margin-left:10px;">🖨️ Fiş basıldı</span>' 
            : '<span style="color:#f4a261; font-size: 0.8rem; margin-left:10px;">⏳ Fiş bekleniyor</span>';

        html += `
        <div class="order-card" style="border-left: 5px solid #e94560;">
          <div class="order-header" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
            <div>
              <span class="table-badge" style="font-size: 1.2rem; padding: 8px 15px;">Masa ${order.tableNumber}</span>
              <span style="color: var(--text-muted); font-size: 0.95rem; margin-left: 10px;">⏱️ ${timeSince} (${orderTime})</span>
              ${printBadge}
            </div>
          </div>
          <div class="order-items">
            ${generatePersonGroupedItemsForKitchen(order.items)}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
}

// Get time since order was created
function getTimeSince(createdAt) {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}s ${mins}dk`;
}

// Update order count badge
function updateOrderCount() {
    const orderCountBadge = document.getElementById('orderCount');
    if (orderCountBadge) {
        if (orders.length === 0) {
            orderCountBadge.textContent = 'Bekleyen Sipariş Yok ✓';
            orderCountBadge.style.background = '#2a9d8f';
        } else {
            orderCountBadge.textContent = `${orders.length} Bekleyen Sipariş`;
            orderCountBadge.style.background = '#e94560';
        }
    }
}

// Listeners
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshKitchenBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadKitchenOrders);
    }

    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-category]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            displayKitchenOrders();
        });
    });

    loadKitchenOrders();
    setInterval(loadKitchenOrders, 5000); // 5sn'de bir taze le
});
