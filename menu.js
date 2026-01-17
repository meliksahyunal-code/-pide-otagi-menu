// Menü verileri
const menuData = {
  pides: [
    { name: "Çökeleği Pide", price: 130 },
    { name: "Kıymalı Pide", price: 140 },
    { name: "Kuşbaşılı Pide", price: 200 },
    { name: "Patatesli Pide", price: 130 },
    { name: "Karışık Pide", price: 230 },
    { name: "Kuşbaşı Kaşarlı Pide", price: 230 },
    { name: "Kıymalı Kaşarlı Pide", price: 180 }
  ],
  drinks: [
    { name: "Ayran", price: 25 },
    { name: "Kola Kutu", price: 25 },
    { name: "Kola Şişe", price: 40 },
    { name: "Gazlı İçecek", price: 40 },
    { name: "Meyve Suyu", price: 60 },
    { name: "Fanta Suyu", price: 30 },
    { name: "Gazoz", price: 30 },
    { name: "İcetea", price: 30 },
    { name: "Su", price: 17 },
    { name: "Doğal Çay", price: 20 }
  ]
};

// Menüyü render eden fonksiyon
function renderMenu() {
  const pidesContainer = document.getElementById('pides-container');
  const drinksContainer = document.getElementById('drinks-container');

  if (pidesContainer) {
    pidesContainer.innerHTML = menuData.pides.map(item => `
      <div class="menu-item">
        <div class="item-name">${item.name}</div>
        <div class="item-price">
          ${item.price}<span class="currency">₺</span>
        </div>
      </div>
    `).join('');
  }

  if (drinksContainer) {
    drinksContainer.innerHTML = menuData.drinks.map(item => `
      <div class="menu-item">
        <div class="item-name">${item.name}</div>
        <div class="item-price">
          ${item.price}<span class="currency">₺</span>
        </div>
      </div>
    `).join('');
  }
}

// Sayfa yüklendiğinde menüyü render et
document.addEventListener('DOMContentLoaded', renderMenu);
