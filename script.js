// ===== CONFIGURATION =====
const scriptURL = 'https://script.google.com/macros/s/AKfycbxUjMUj8swHI2doR3uTA2ui7J9EJk8n6FphX0MQRrNbQzc1Qgl8nTNERY1M2XwCRujb/exec';

let numPersonnel = 27;
let mealData = [];
let currentDate = new Date();

const soldierNames = [
    "Huỳnh Tấn Phát", "Phạm Anh Khoa", "Nguyễn Tấn Dũng", "Nguyễn Văn Hoa", "Nguyễn Xuân Tân",
    "Nguyễn Thị Thu Hồng", "Huỳnh Thanh Tiểu Vũ", "Hoàng Hữu Thiện Nhân", "Lê Thành Nhân",
    "Nguyễn Phi Hùng", "Võ Huỳnh Trọng Đức", "Võ Tấn Thành", "Đoàn Đức Nghĩa", "Nguyễn Minh Vương",
    "Nguyễn Sóc Chu", "Huỳnh Khánh Đức", "Đoàn Văn Minh", "Phan Quốc Thái", "Nguyễn Huy Phong",
    "Mai Thành Đạt", "Lương Đình Nghĩa", "Lê Văn Thanh Hà", "Nguyễn Quốc Khánh", "Hoàng Mạnh Quỳnh",
    "Trần Thị Thanh Thủy", "Phạm Minh Quyến", "Nguyễn Trường Hận"
];

// ===== DATE HELPERS =====
function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ===== INIT =====
window.onload = function () {
    init();
};

function init() {
    updateNavDisplay();
    loadOtherCosts();
    renderDayPicker();
    loadDayState(); // Gọi hàm lấy dữ liệu
}

// ===== CORE SYNC LOGIC (SỬA TẠI ĐÂY) =====
async function loadDayState() {
    let key = 'mealApp_Day_' + dateKey(currentDate);
    let saved = localStorage.getItem(key);

    // 1. Hiển thị dữ liệu cục bộ trước (để giao diện không trống)
    if (saved) {
        let state = JSON.parse(saved);
        mealData = state.mealData;
        document.getElementById('gia-trua').value = state.priceTrua || '29.500';
        document.getElementById('gia-toi').value = state.priceToi || '29.500';
    } else {
        mealData = defaultMealData();
        document.getElementById('gia-trua').value = '29.500';
        document.getElementById('gia-toi').value = '29.500';
    }
    renderPersonnelList();
    calculate();

    // 2. Lấy dữ liệu từ Google Sheets (Nguồn chuẩn nhất)
    if (scriptURL) {
        try {
            const resp = await fetch(`${scriptURL}?date=${dateKey(currentDate)}&t=${Date.now()}`);
            const cloud = await resp.json();

            if (cloud && cloud.mealData && cloud.mealData.length > 0) {
                mealData = cloud.mealData;
                document.getElementById('gia-trua').value = cloud.priceTrua || '29.500';
                document.getElementById('gia-toi').value = cloud.priceToi || '29.500';

                if (cloud.otherCosts && cloud.otherCosts.length > 0) {
                    localStorage.setItem('mealApp_OtherCosts', JSON.stringify(cloud.otherCosts));
                    loadOtherCosts();
                }
                saveDayState(); // Cập nhật ngược lại LocalStorage
                renderPersonnelList();
                calculate();
                console.log("Đã đồng bộ từ Cloud thành công.");
            }
        } catch (e) {
            console.log("Không có dữ liệu Cloud cho ngày này hoặc lỗi kết nối.");
        }
    }
}

async function syncData() {
    if (!scriptURL) return;

    // Hiện thông báo đang lưu
    const toast = document.getElementById('toast');
    if (toast) { toast.innerText = "Đang đồng bộ..."; toast.classList.add('show'); }

    let otherCosts = JSON.parse(localStorage.getItem('mealApp_OtherCosts') || "[]");

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            mode: 'cors', // Chuyển sang cors để nhận phản hồi
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                date: dateKey(currentDate),
                data: mealData,
                priceTrua: document.getElementById('gia-trua').value,
                priceToi: document.getElementById('gia-toi').value,
                otherCosts: otherCosts
            })
        });
        const result = await response.json();
        if (result.status === "success" && toast) {
            toast.innerText = "Đã đồng bộ thành công!";
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
    } catch (e) {
        console.error('Lỗi sync:', e);
        if (toast) toast.innerText = "Lỗi kết nối Cloud!";
    }
}

function saveData() {
    saveDayState();
    saveOtherCosts();
    syncData(); // Gọi hàm đồng bộ lên Google
}

// ===== CÁC HÀM CÒN LẠI GIỮ NGUYÊN GỐC =====
function defaultMealData() {
    return soldierNames.map((name, i) => ({
        id: i + 1,
        name: "#" + String(i + 1).padStart(2, '0') + " " + name,
        trua: true,
        toi: true
    }));
}

function renderPersonnelList() {
    const listContainer = document.getElementById('personnel-list');
    listContainer.innerHTML = '';
    mealData.forEach((person, index) => {
        const card = document.createElement('div');
        card.className = 'person-card';
        let tClass = person.trua ? "active" : "";
        let mClass = person.toi ? "active" : "";
        card.innerHTML = `
            <div class="person-name">${person.name}</div>
            <div class="btn-group">
                <button class="toggle-btn ${tClass}" onclick="toggleMeal(${index}, 'trua', this)">Trưa</button>
                <button class="toggle-btn ${mClass}" onclick="toggleMeal(${index}, 'toi', this)">Tối</button>
            </div>`;
        listContainer.appendChild(card);
    });
}

function toggleMeal(index, type, btnEl) {
    mealData[index][type] = !mealData[index][type];
    btnEl.classList.toggle('active');
    calculate();
}

function saveDayState() {
    localStorage.setItem('mealApp_Day_' + dateKey(currentDate), JSON.stringify({
        mealData: mealData,
        priceTrua: document.getElementById('gia-trua').value,
        priceToi: document.getElementById('gia-toi').value
    }));
}

function calculate() {
    // Chèn lại toàn bộ logic calculate() cũ của bạn vào đây...
    // (Vì code calculate của bạn rất dài nên tôi không dán hết, hãy giữ nguyên nó)
    saveDayState();
}

// ... Copy lại các hàm changeMonth, renderDayPicker, formatCurrency, v.v. từ code cũ của bạn ...