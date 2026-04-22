const scriptURL = 'https://script.google.com/macros/s/AKfycbxUjMUj8swHI2doR3uTA2ui7J9EJk8n6FphX0MQRrNbQzc1Qgl8nTNERY1M2XwCRujb/exec';

let numPersonnel = 27;
let mealData = [];
let currentDate = new Date();
const soldierNames = ["Huỳnh Tấn Phát", "Phạm Anh Khoa", "Nguyễn Tấn Dũng", "Nguyễn Văn Hoa", "Nguyễn Xuân Tân", "Nguyễn Thị Thu Hồng", "Huỳnh Thanh Tiểu Vũ", "Hoàng Hữu Thiện Nhân", "Lê Thành Nhân", "Nguyễn Phi Hùng", "Võ Huỳnh Trọng Đức", "Võ Tấn Thành", "Đoàn Đức Nghĩa", "Nguyễn Minh Vương", "Nguyễn Sóc Chu", "Huỳnh Khánh Đức", "Đoàn Văn Minh", "Phan Quốc Thái", "Nguyễn Huy Phong", "Mai Thành Đạt", "Lương Đình Nghĩa", "Lê Văn Thanh Hà", "Nguyễn Quốc Khánh", "Hoàng Mạnh Quỳnh", "Trần Thị Thanh Thủy", "Phạm Minh Quyến", "Nguyễn Trường Hận"];

// Khởi tạo app
window.onload = () => { init(); };

function init() {
    updateNavDisplay();
    loadOtherCosts();
    renderDayPicker();
    loadDayState(); // Hàm này sẽ lấy dữ liệu từ Google Sheets
}

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function loadDayState() {
    const key = 'mealApp_Day_' + dateKey(currentDate);
    const local = localStorage.getItem(key);

    // Ưu tiên hiển thị nhanh từ LocalStorage trước
    if (local) {
        const s = JSON.parse(local);
        mealData = s.mealData;
        document.getElementById('gia-trua').value = s.priceTrua || '29.500';
        document.getElementById('gia-toi').value = s.priceToi || '29.500';
    } else {
        mealData = soldierNames.map((n, i) => ({ id: i + 1, name: `#${String(i + 1).padStart(2, '0')} ${n}`, trua: true, toi: true }));
    }
    renderPersonnelList();
    calculate();

    // FETCH đồng bộ từ Cloud (Nguồn tin cậy nhất)
    try {
        const resp = await fetch(`${scriptURL}?date=${dateKey(currentDate)}&t=${Date.now()}`);
        const cloud = await resp.json();
        if (cloud && cloud.mealData.length > 0) {
            mealData = cloud.mealData;
            document.getElementById('gia-trua').value = cloud.priceTrua;
            document.getElementById('gia-toi').value = cloud.priceToi;
            if (cloud.otherCosts.length > 0) localStorage.setItem('mealApp_OtherCosts', JSON.stringify(cloud.otherCosts));

            saveDayState(); // Cập nhật lại Local sau khi lấy được Cloud
            renderPersonnelList();
            calculate();
            console.log("Đã đồng bộ từ Cloud.");
        }
    } catch (e) { console.log("Ngày mới hoặc lỗi kết nối Cloud."); }
}

async function saveData() {
    saveDayState();
    saveOtherCosts();

    // Hiển thị loading/toast
    const toast = document.getElementById('toast');
    toast.innerText = "Đang đồng bộ Cloud...";
    toast.classList.add('show');

    try {
        const otherCosts = JSON.parse(localStorage.getItem('mealApp_OtherCosts') || "[]");
        const resp = await fetch(scriptURL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                date: dateKey(currentDate),
                data: mealData,
                priceTrua: document.getElementById('gia-trua').value,
                priceToi: document.getElementById('gia-toi').value,
                otherCosts: otherCosts
            })
        });
        const res = await resp.json();
        if (res.status === "success") {
            toast.innerText = "Đã lưu & Đồng bộ thành công!";
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
    } catch (e) {
        toast.innerText = "Lỗi đồng bộ Cloud!";
        console.error(e);
    }
}

// --- CÁC HÀM UI GIỮ NGUYÊN NHƯ CŨ NHƯNG TỐI GIẢN ---
function saveDayState() {
    localStorage.setItem('mealApp_Day_' + dateKey(currentDate), JSON.stringify({
        mealData: mealData,
        priceTrua: document.getElementById('gia-trua').value,
        priceToi: document.getElementById('gia-toi').value
    }));
}

function renderPersonnelList() {
    const container = document.getElementById('personnel-list');
    container.innerHTML = '';
    mealData.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = `
            <div class="person-name">${p.name}</div>
            <div class="btn-group">
                <button class="toggle-btn ${p.trua ? 'active' : ''}" onclick="toggleMeal(${i}, 'trua', this)">Trưa</button>
                <button class="toggle-btn ${p.toi ? 'active' : ''}" onclick="toggleMeal(${i}, 'toi', this)">Tối</button>
            </div>`;
        container.appendChild(card);
    });
}

function toggleMeal(idx, type, btn) {
    mealData[idx][type] = !mealData[idx][type];
    btn.classList.toggle('active');
    calculate();
}

function calculate() {
    // Giữ nguyên logic calculate hiện tại của bạn để tính toán tiền...
    // Nhớ gọi saveDayState() cuối hàm calculate để lưu thay đổi tạm thời
    saveDayState();
}

// Bổ sung các hàm điều hướng tháng/ngày, format tiền... từ code cũ của bạn vào đây.