
const PRODUCTS = [
    { id: 1, name: "Футболка Basic", cat: "Футболки", price: 1290, img: "images/tshirt-basic.svg", desc: "Плотный хлопок, свободный крой. Подойдёт на каждый день." },
    { id: 2, name: "Футболка Polo", cat: "Футболки", price: 1690, img: "images/tshirt-polo.svg", desc: "Классическое поло с воротником и застёжкой на пуговицы." },
    { id: 3, name: "Худи Urban", cat: "Верхняя одежда", price: 3990, img: "images/hoodie.svg", desc: "Тёплое худи с капюшоном и карманом-кенгуру." },
    { id: 4, name: "Куртка Bomber", cat: "Верхняя одежда", price: 6490, img: "images/bomber.svg", desc: "Бомбер на молнии с трикотажными манжетами." },
    { id: 5, name: "Джинсы Straight", cat: "Брюки", price: 3290, img: "images/jeans.svg", desc: "Прямой крой, плотный деним, средняя посадка." },
    { id: 6, name: "Брюки Chino", cat: "Брюки", price: 2790, img: "images/chino.svg", desc: "Лёгкие брюки из хлопкового твила с ремнём." },
    { id: 7, name: "Платье Summer", cat: "Платья", price: 3490, img: "images/dress-summer.svg", desc: "Лёгкое платье миди из вискозы с принтом в горох." },
    { id: 8, name: "Платье Evening", cat: "Платья", price: 5890, img: "images/dress-evening.svg", desc: "Вечернее платье с V-образным вырезом и поясом." },
    { id: 9, name: "Кроссовки Run", cat: "Обувь", price: 4990, img: "images/sneakers.svg", desc: "Лёгкие кроссовки с амортизирующей подошвой." },
    { id: 10, name: "Ботинки Trek", cat: "Обувь", price: 7290, img: "images/boots.svg", desc: "Кожаные ботинки на шнуровке для осени." },
    { id: 11, name: "Шарф Wool", cat: "Аксессуары", price: 1490, img: "images/scarf.svg", desc: "Шерстяной шарф с полосками и бахромой." },
    { id: 12, name: "Кепка Classic", cat: "Аксессуары", price: 990, img: "images/cap.svg", desc: "Хлопковая кепка с изогнутым козырьком." }
];

const SIZES = ["XS", "S", "M", "L", "XL"];
const PROMOS = { THREAD10: 0.10, WELCOME5: 0.05 };
const CATEGORIES = ["Все", ...new Set(PRODUCTS.map(p => p.cat))];


function load(key, fallback) {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v === null ? fallback : v;
    } catch (e) {
        return fallback;
    }
}

const state = {
    cat: "Все",
    query: "",
    sort: "default",
    favOnly: false,
    cart: load("cart", []),     // [{ id, size, qty }]
    favs: load("favs", []),     // [id, id, ...]
    promo: load("promo", null),
    modalProduct: null,
    modalSize: "M"
};

function save() {
    localStorage.setItem("cart", JSON.stringify(state.cart));
    localStorage.setItem("favs", JSON.stringify(state.favs));
    localStorage.setItem("promo", JSON.stringify(state.promo));
}

const $ = sel => document.querySelector(sel);
const money = n => n.toLocaleString("ru-RU") + " сом";
const findProduct = id => PRODUCTS.find(p => p.id === id);


function renderChips() {
    $("#chips").innerHTML = CATEGORIES.map(c =>
        `<button class="chip ${c === state.cat && !state.favOnly ? "active" : ""}" data-cat="${c}">${c}</button>`
    ).join("");
}

function getList() {
    let list = PRODUCTS.filter(p =>
        (state.cat === "Все" || p.cat === state.cat) &&
        p.name.toLowerCase().includes(state.query.toLowerCase()) &&
        (!state.favOnly || state.favs.includes(p.id))
    );
    if (state.sort === "asc") list.sort((a, b) => a.price - b.price);
    if (state.sort === "desc") list.sort((a, b) => b.price - a.price);
    return list;
}

function renderGrid() {
    const list = getList();

    if (list.length === 0) {
        $("#grid").innerHTML = `<div class="empty">Ничего не найдено 😕</div>`;
        return;
    }


    $("#grid").innerHTML = list.map(p => `
    <article class="card" data-open="${p.id}">
      <img src="${p.img}" alt="${p.name}">
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="price">${money(p.price)}</div>
      </div>
    </article>
  `).join("");
}

$("#chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    state.favOnly = false;
    updateFavBtn();
    renderChips();
    renderGrid();
});

$("#search").addEventListener("input", e => {
    state.query = e.target.value;
    renderGrid();
});

$("#sort").addEventListener("change", e => {
    state.sort = e.target.value;
    renderGrid();
});

$("#grid").addEventListener("click", e => {
    const card = e.target.closest("[data-open]");
    if (card) openModal(Number(card.dataset.open));
});


function toggleFav(id) {
    const i = state.favs.indexOf(id);
    if (i >= 0) {
        state.favs.splice(i, 1);
        toast("Удалено из избранного");
    } else {
        state.favs.push(id);
        toast("Добавлено в избранное ♥");
    }
    save();
    updateBadges();
    renderGrid();
}

function updateFavBtn() {
    $("#favBtn").classList.toggle("active", state.favOnly);
}

// Кнопка ♥ в шапке включает и выключает показ избранного
$("#favBtn").addEventListener("click", () => {
    state.favOnly = !state.favOnly;
    if (state.favOnly && state.favs.length === 0) {
        state.favOnly = false;
        toast("В избранном пока пусто");
        return;
    }
    state.cat = "Все";
    updateFavBtn();
    renderChips();
    renderGrid();
    $("#catalog").scrollIntoView();
    toast(state.favOnly ? "Показано избранное" : "Показан весь каталог");
});


function openModal(id) {
    const p = findProduct(id);
    state.modalProduct = p;
    state.modalSize = "M";

    $("#mImg").src = p.img;
    $("#mImg").alt = p.name;
    $("#mCat").textContent = p.cat;
    $("#mName").textContent = p.name;
    $("#mDesc").textContent = p.desc;
    $("#mPrice").textContent = money(p.price);
    renderSizes();
    renderModalFav();

    $("#modal").classList.add("show");
    $("#overlay").classList.add("show");
}

function renderSizes() {
    $("#mSizes").innerHTML = SIZES.map(s =>
        `<button class="size ${s === state.modalSize ? "active" : ""}" data-size="${s}">${s}</button>`
    ).join("");
}

function renderModalFav() {
    const isFav = state.favs.includes(state.modalProduct.id);
    $("#mFav").textContent = isFav ? "♥ В избранном" : "♡ В избранное";
}

$("#mSizes").addEventListener("click", e => {
    const btn = e.target.closest("[data-size]");
    if (!btn) return;
    state.modalSize = btn.dataset.size;
    renderSizes();
});

$("#mFav").addEventListener("click", () => {
    toggleFav(state.modalProduct.id);
    renderModalFav();
});

$("#mAdd").addEventListener("click", () => {
    addToCart(state.modalProduct.id, state.modalSize);
    closeAll();
});


function addToCart(id, size) {
    const item = state.cart.find(i => i.id === id && i.size === size);
    if (item) item.qty++;
    else state.cart.push({ id, size, qty: 1 });

    save();
    updateBadges();
    renderCart();
    toast(`«${findProduct(id).name}» (${size}) добавлено в корзину`);
}

function renderCart() {
    const box = $("#cartList");

    if (state.cart.length === 0) {
        box.innerHTML = `<p class="empty">Корзина пуста 🛍️</p>`;
    } else {
        box.innerHTML = state.cart.map((item, index) => {
            const p = findProduct(item.id);
            return `
        <div class="cart-item">
          <img class="cart-thumb" src="${p.img}" alt="${p.name}">
          <div class="cart-info">
            <b>${p.name}</b><br>
            <small>Размер: ${item.size} · ${money(p.price)}</small>
            <div class="qty">
              <button data-dec="${index}">−</button>
              <span>${item.qty}</span>
              <button data-inc="${index}">+</button>
            </div>
          </div>
          <button class="remove" data-del="${index}" title="Удалить">🗑</button>
        </div>`;
        }).join("");
    }


    const sum = state.cart.reduce((s, i) => s + findProduct(i.id).price * i.qty, 0);
    const discount = state.promo ? PROMOS[state.promo] : 0;
    $("#total").textContent = money(Math.round(sum * (1 - discount)));

    const msg = $("#promoMsg");
    if (state.promo) {
        msg.style.color = "#2e8b57";
        msg.textContent = `Промокод ${state.promo}: скидка ${discount * 100}%`;
    } else {
        msg.textContent = "";
    }
}

$("#cartList").addEventListener("click", e => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const del = e.target.closest("[data-del]");

    if (inc) {
        state.cart[Number(inc.dataset.inc)].qty++;
    } else if (dec) {
        const index = Number(dec.dataset.dec);
        state.cart[index].qty--;
        if (state.cart[index].qty <= 0) state.cart.splice(index, 1);
    } else if (del) {
        state.cart.splice(Number(del.dataset.del), 1);
    } else {
        return;
    }

    save();
    updateBadges();
    renderCart();
});

$("#promoBtn").addEventListener("click", () => {
    const code = $("#promoInput").value.trim().toUpperCase();
    if (PROMOS[code]) {
        state.promo = code;
        save();
        renderCart();
        toast("Промокод применён!");
    } else {
        state.promo = null;
        save();
        renderCart();
        $("#promoMsg").style.color = "#d93025";
        $("#promoMsg").textContent = "Неверный промокод";
    }
});

$("#checkout").addEventListener("click", () => {
    if (state.cart.length === 0) {
        toast("Корзина пуста");
        return;
    }
    const total = $("#total").textContent;
    state.cart = [];
    state.promo = null;
    save();
    updateBadges();
    renderCart();
    closeAll();
    toast(`Заказ оформлен на сумму ${total}. Спасибо! 🎉`);
});

function updateBadges() {
    $("#cartCount").textContent = state.cart.reduce((s, i) => s + i.qty, 0);
    $("#favCount").textContent = state.favs.length;
}

// ===== Открытие и закрытие окон =====
$("#cartBtn").addEventListener("click", () => {
    renderCart();
    $("#drawer").classList.add("show");
    $("#overlay").classList.add("show");
});

function closeAll() {
    $("#modal").classList.remove("show");
    $("#drawer").classList.remove("show");
    $("#overlay").classList.remove("show");
}

$("#overlay").addEventListener("click", closeAll);
$("#mClose").addEventListener("click", closeAll);
$("#dClose").addEventListener("click", closeAll);
document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAll();
});

// ===== Тёмная тема =====
function applyTheme(dark) {
    document.body.classList.toggle("dark", dark);
    $("#themeBtn").textContent = dark ? "☀️" : "🌙";
    localStorage.setItem("dark", JSON.stringify(dark));
}

$("#themeBtn").addEventListener("click", () => {
    applyTheme(!document.body.classList.contains("dark"));
});

// ===== Услуги: кнопка «Заказать» подставляет текст в форму =====
document.querySelectorAll("[data-service]").forEach(btn => {
    btn.addEventListener("click", () => {
        $("#msg").value = `Здравствуйте! Хочу заказать услугу: «${btn.dataset.service}».`;
        $("#contact").scrollIntoView();
        $("#name").focus();
    });
});


function setError(fieldId, text) {
    const field = $("#" + fieldId);
    field.classList.toggle("error", text !== "");
    field.querySelector(".err-msg").textContent = text;
    return text === "";
}

$("#form").addEventListener("submit", e => {
    e.preventDefault();

    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const msg = $("#msg").value.trim();

    const ok1 = setError("f-name", name.length < 2 ? "Введите имя (минимум 2 символа)" : "");
    const ok2 = setError("f-email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Введите корректный email");
    const ok3 = setError("f-msg", msg.length < 10 ? "Сообщение слишком короткое (минимум 10 символов)" : "");

    if (ok1 && ok2 && ok3) {
        e.target.reset();
        toast("Сообщение отправлено ✅");
    }
});


let toastTimer;
function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}


applyTheme(load("dark", false));
renderChips();
renderGrid();
renderCart();
updateBadges();
