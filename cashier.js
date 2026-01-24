// Cashier Panel JavaScript
// API_BASE_URL is loaded from config.js

// State
let currentTableNumber = null;
let currentTableData = null;
let selectedItems = new Set(); // Stores unique item identifiers "orderId-itemIndex"
let unpaidTables = new Set(); // Track tables with unpaid orders
let currentView = 'list'; // 'list' or 'map'

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTables();
    setupEventListeners();

    // Auto-refresh every 30 seconds
    setInterval(loadTables, 30000);
});

function setupEventListeners() {
    document.getElementById('backToTablesBtn').addEventListener('click', () => {
        showTableList();
    });

    document.getElementById('paySelectedBtn').addEventListener('click', paySelectedItems);
    document.getElementById('payAllTableBtn').addEventListener('click', payAllTable);

    // View toggle buttons
    document.getElementById('listViewBtn').addEventListener('click', () => switchView('list'));
    document.getElementById('mapViewBtn').addEventListener('click', () => switchView('map'));

    // Refresh button
    document.getElementById('refreshTablesBtn').addEventListener('click', () => {
        loadTables();
    });
}

function switchView(view) {
    currentView = view;

    const listView = document.getElementById('tableListContainer');
    const mapView = document.getElementById('tableMapContainer');
    const listBtn = document.getElementById('listViewBtn');
    const mapBtn = document.getElementById('mapViewBtn');

    if (view === 'list') {
        listView.style.display = 'grid';
        mapView.style.display = 'none';
        listBtn.classList.add('active');
        mapBtn.classList.remove('active');
    } else {
        listView.style.display = 'none';
        mapView.style.display = 'block';
        mapBtn.classList.add('active');
        listBtn.classList.remove('active');

        // Update map colors when switching to map view
        updateMapColors();
    }
}

function updateMapColors() {
    // Reset all table buttons first
    document.querySelectorAll('#tableMapContainer .table-btn').forEach(btn => {
        btn.classList.remove('has-unpaid');
        btn.style.pointerEvents = 'none'; // Disable by default
        btn.onclick = null;
    });

    // Color and enable tables with unpaid orders
    unpaidTables.forEach(tableNum => {
        const tableBtn = document.querySelector(`#tableMapContainer .table-btn[data-table="${tableNum}"]`);
        if (tableBtn) {
            tableBtn.classList.add('has-unpaid');
            tableBtn.style.pointerEvents = 'auto';
            tableBtn.onclick = () => selectTable(tableNum);
        }
    });
}

// Load all tables with unpaid orders
async function loadTables() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        const orders = await response.json();

        // Get unique tables with delivered/partially_paid status
        const tablesMap = new Map();
        unpaidTables.clear(); // Clear the set

        orders.forEach(order => {
            if (order.status === 'delivered' || order.status === 'partially_paid') {
                const tableNum = order.tableNumber;
                unpaidTables.add(tableNum); // Track table number

                if (!tablesMap.has(tableNum)) {
                    tablesMap.set(tableNum, {
                        tableNumber: tableNum,
                        totalUnpaid: 0,
                        orderCount: 0
                    });
                }

                const tableData = tablesMap.get(tableNum);
                // Calculate unpaid amount
                const unpaidAmount = order.items
                    .filter(item => !item.paidStatus)
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

                tableData.totalUnpaid += unpaidAmount;
                tableData.orderCount++;
            }
        });

        displayTables(Array.from(tablesMap.values()));

        // Update map if currently in map view
        if (currentView === 'map') {
            updateMapColors();
        }
    } catch (error) {
        console.error('Masalar yüklenirken hata:', error);
    }
}

function displayTables(tables) {
    const container = document.getElementById('tableListContainer');

    if (tables.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>✅ Ödeme bekleyen masa yok</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tables.map(table => `
        <div class="table-card" onclick="selectTable('${table.tableNumber}')">
            <div class="table-card-header">
                <span class="table-number">Masa ${table.tableNumber}</span>
                <span class="order-count-badge">${table.orderCount} sipariş</span>
            </div>
            <div class="table-card-amount">${table.totalUnpaid}₺</div>
        </div>
    `).join('');
}

// Select a table and show item selection view
async function selectTable(tableNumber) {
    currentTableNumber = tableNumber;

    // Load payment view data from API
    try {
        const response = await fetch(`${API_BASE_URL}/api/tables/${tableNumber}/payment-view`);
        currentTableData = await response.json();

        // Reset selection
        selectedItems.clear();

        // Show item selection view
        document.getElementById('tab-tables').style.display = 'none';
        document.getElementById('itemSelectionView').style.display = 'block';
        document.getElementById('selectedTableTitle').textContent = `💰 Masa ${tableNumber}`;

        displayItems(currentTableData.items);
        updatePaymentSummary();
    } catch (error) {
        console.error('Masa verileri yüklenirken hata:', error);
        alert('Hata: ' + error.message);
    }
}

function displayItems(items) {
    const container = document.getElementById('itemSelectionContainer');

    // Group items by person for better organization
    const itemsByPerson = {};
    items.forEach((item, index) => {
        const personNum = item.personNumber || 1;
        if (!itemsByPerson[personNum]) {
            itemsByPerson[personNum] = [];
        }
        itemsByPerson[personNum].push({ ...item, globalIndex: index });
    });

    const personColors = ['#667eea', '#f093fb', '#38ef7d', '#f4a261', '#e76f51'];

    let html = '';
    Object.keys(itemsByPerson).sort((a, b) => a - b).forEach((personNum, index) => {
        const color = personColors[index % personColors.length];
        const personItems = itemsByPerson[personNum];

        html += `<div class="person-group">`;

        personItems.forEach(item => {
            const itemKey = `${item.orderId}-${item.itemIndex}`;
            const isDisabled = item.paidStatus;
            const isChecked = selectedItems.has(itemKey);

            html += `
                <div class="item-checkbox-row ${isDisabled ? 'item-paid' : ''}">
                    <input 
                        type="checkbox" 
                        id="item-${itemKey}" 
                        class="item-checkbox"
                        data-item-key="${itemKey}"
                        data-order-id="${item.orderId}"
                        data-item-index="${item.itemIndex}"
                        data-item-total="${item.itemTotal}"
                        ${isDisabled ? 'disabled' : ''}
                        ${isChecked ? 'checked' : ''}
                        onchange="toggleItemSelection(this)"
                    >
                    <label for="item-${itemKey}" class="item-label">
                        <span class="person-badge" style="background-color: ${color};">
                            K${personNum}
                        </span>
                        <span class="item-name">${item.quantity}x ${item.name}</span>
                        <span class="item-price">${item.itemTotal}₺</span>
                        ${isDisabled ? '<span class="paid-badge">✓ Ödendi</span>' : ''}
                    </label>
                </div>
            `;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

function toggleItemSelection(checkbox) {
    const itemKey = checkbox.dataset.itemKey;

    if (checkbox.checked) {
        selectedItems.add(itemKey);
    } else {
        selectedItems.delete(itemKey);
    }

    updatePaymentSummary();
}

function updatePaymentSummary() {
    // Calculate selected total
    let selectedTotal = 0;
    selectedItems.forEach(itemKey => {
        const checkbox = document.querySelector(`[data-item-key="${itemKey}"]`);
        if (checkbox) {
            selectedTotal += parseFloat(checkbox.dataset.itemTotal);
        }
    });

    // Update UI
    document.getElementById('selectedTotal').textContent = `${selectedTotal}₺`;
    document.getElementById('totalUnpaid').textContent = `${currentTableData.totalUnpaid}₺`;

    const paySelectedBtn = document.getElementById('paySelectedBtn');
    const selectedCount = selectedItems.size;

    if (selectedCount > 0) {
        paySelectedBtn.disabled = false;
        paySelectedBtn.textContent = `✅ Seçilenleri Öde (${selectedCount} ürün - ${selectedTotal}₺)`;
    } else {
        paySelectedBtn.disabled = true;
        paySelectedBtn.textContent = `✅ Seçilenleri Öde (0 ürün)`;
    }

    document.getElementById('payAllTableBtn').textContent =
        `💰 Tüm Masayı Öde (${currentTableData.totalUnpaid}₺)`;
}

async function paySelectedItems() {
    if (selectedItems.size === 0) return;

    const selectedTotal = Array.from(selectedItems).reduce((sum, itemKey) => {
        const checkbox = document.querySelector(`[data-item-key="${itemKey}"]`);
        return sum + (checkbox ? parseFloat(checkbox.dataset.itemTotal) : 0);
    }, 0);

    if (!confirm(`${selectedItems.size} ürün için ${selectedTotal}₺ ödenecek. Onaylıyor musunuz?`)) {
        return;
    }

    try {
        // Group selected items by orderId
        const itemsByOrder = {};
        selectedItems.forEach(itemKey => {
            const checkbox = document.querySelector(`[data-item-key="${itemKey}"]`);
            const orderId = checkbox.dataset.orderId;
            const itemIndex = parseInt(checkbox.dataset.itemIndex);

            if (!itemsByOrder[orderId]) {
                itemsByOrder[orderId] = [];
            }
            itemsByOrder[orderId].push(itemIndex);
        });

        // Pay each order's items
        const promises = Object.entries(itemsByOrder).map(([orderId, itemIndices]) => {
            return fetch(`${API_BASE_URL}/api/orders/${orderId}/pay-items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemIndices })
            });
        });

        await Promise.all(promises);

        alert('✅ Ödeme başarılı!');

        // Reload current table or go back to table list
        const reloadResponse = await fetch(`${API_BASE_URL}/api/tables/${currentTableNumber}/payment-view`);
        const reloadData = await reloadResponse.json();

        if (reloadData.unpaidItemCount === 0) {
            // All paid, go back to table list
            showTableList();
        } else {
            // Still has unpaid items, reload
            selectTable(currentTableNumber);
        }
    } catch (error) {
        console.error('Ödeme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

async function payAllTable() {
    if (!confirm(`Masa ${currentTableNumber} için ${currentTableData.totalUnpaid}₺ ödenecek. Tüm masayı kapatmak istediğinizden emin misiniz?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/tables/${currentTableNumber}/pay-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Ödeme işlemi başarısız');
        }

        const result = await response.json();
        alert('✅ ' + result.message);

        showTableList();
    } catch (error) {
        console.error('Toplu ödeme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

function showTableList() {
    document.getElementById('itemSelectionView').style.display = 'none';
    document.getElementById('tab-tables').style.display = 'block';
    currentTableNumber = null;
    currentTableData = null;
    selectedItems.clear();
    loadTables();
}
