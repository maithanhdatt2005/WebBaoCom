// ===== CONFIGURATION =====
const scriptURL = 'https://script.google.com/macros/s/AKfycbw9df9b790iWn4T59sdphjTKOJu0KJslcC0TS9YlkAGd4Z8QAfwBA85yaK6U2NJN9hh/exec'; // Dán URL Script của bạn vào đây

// ===== GLOBAL STATE =====
let numPersonnel = 27;
let mealData = [];

// Current viewing date
let currentDate = new Date();

// ===== DATE HELPERS =====
function dateKey(dateObj) {
    let y = dateObj.getFullYear();
    let m = String(dateObj.getMonth() + 1).padStart(2, '0');
    let d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function monthKey(dateObj) {
    let y = dateObj.getFullYear();
    let m = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function getFormattedDate() {
    const today = new Date();
    return `${dayNames[today.getDay()]}, ${today.getDate()} tháng ${today.getMonth() + 1}, ${today.getFullYear()}`;
}
document.getElementById('current-date-display').innerText = getFormattedDate();

// ===== DAY/MONTH NAVIGATOR =====
function updateNavDisplay() {
    document.getElementById('nav-month-display').innerText =
        `Tháng ${currentDate.getMonth() + 1} / ${currentDate.getFullYear()}`;
}

function changeMonth(delta) {
    saveDayState();
    let newMonth = currentDate.getMonth() + delta;
    let newYear = currentDate.getFullYear();
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }

    // Keep same day, clamped to last day of new month
    let maxDay = new Date(newYear, newMonth + 1, 0).getDate();
    let day = Math.min(currentDate.getDate(), maxDay);
    currentDate = new Date(newYear, newMonth, day);

    updateNavDisplay();
    renderDayPicker();
    loadDayState();
}

function renderDayPicker() {
    const picker = document.getElementById('day-picker');
    picker.innerHTML = '';

    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let mk = monthKey(currentDate);

    for (let d = 1; d <= daysInMonth; d++) {
        let btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.innerText = d;

        // Check saved data for this day
        let dayStr = `${mk}-${String(d).padStart(2, '0')}`;
        let savedRaw = localStorage.getItem('mealApp_Day_' + dayStr);
        if (savedRaw) {
            let savedState = JSON.parse(savedRaw);
            // Check if ANY person cut a meal (trua:false or toi:false)
            let hasCut = savedState.mealData && savedState.mealData.some(p => !p.trua || !p.toi);
            if (hasCut) {
                btn.classList.add('has-cutmeal');
            } else {
                btn.classList.add('has-data');
            }
        }

        // Highlight selected day
        if (d === currentDate.getDate()) {
            btn.classList.add('selected');
        }

        btn.addEventListener('click', () => selectDay(d));
        picker.appendChild(btn);
    }
}

function selectDay(day) {
    saveDayState();
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    renderDayPicker();
    loadDayState();
}

// ===== PER-DAY STATE =====
const soldierNames = [
    "Huỳnh Tấn Phát",
    "Phạm Anh Khoa",
    "Nguyễn Tấn Dũng",
    "Nguyễn Văn Hoa",
    "Nguyễn Xuân Tân",
    "Nguyễn Thị Thu Hồng",
    "Huỳnh Thanh Tiểu Vũ",
    "Hoàng Hữu Thiện Nhân",
    "Lê Thành Nhân",
    "Nguyễn Phi Hùng",
    "Võ Huỳnh Trọng Đức",
    "Võ Tấn Thành",
    "Đoàn Đức Nghĩa",
    "Nguyễn Minh Vương",
    "Nguyễn Sóc Chu",
    "Huỳnh Khánh Đức",
    "Đoàn Văn Minh",
    "Phan Quốc Thái",
    "Nguyễn Huy Phong",
    "Mai Thành Đạt",
    "Lương Đình Nghĩa",
    "Lê Văn Thanh Hà",
    "Nguyễn Quốc Khánh",
    "Hoàng Mạnh Quỳnh",
    "Trần Thị Thanh Thủy",
    "Phạm Minh Quyến",
    "Nguyễn Trường Hận"
];

function defaultMealData() {
    let data = [];
    for (let i = 1; i <= numPersonnel; i++) {
        let paddedId = i < 10 ? "0" + i : i;
        let name = "#" + paddedId + " " + (soldierNames[i - 1] || "Chiến sĩ " + paddedId);
        data.push({ id: i, name: name, trua: true, toi: true });
    }
    return data;
}

function saveDayState() {
    let key = 'mealApp_Day_' + dateKey(currentDate);

    let state = {
        mealData: mealData,
        priceTrua: document.getElementById('gia-trua').value,
        priceToi: document.getElementById('gia-toi').value
        // otherCosts intentionally excluded — stored separately
    };

    localStorage.setItem(key, JSON.stringify(state));
}

function saveOtherCosts() {
    let otherCosts = [];
    document.querySelectorAll('.other-cost-item').forEach(row => {
        otherCosts.push({
            name: row.querySelector('.other-cost-name').value,
            val: row.querySelector('.other-cost-input').value
        });
    });
    localStorage.setItem('mealApp_OtherCosts', JSON.stringify(otherCosts));
}

function loadOtherCosts() {
    const container = document.getElementById('other-costs-container');
    if (!container) return;
    container.innerHTML = '';
    let saved = localStorage.getItem('mealApp_OtherCosts');
    try {
        if (saved) {
            let parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach(c => renderOtherCostRow(c.name, c.val));
            } else {
                renderOtherCostRow('Khoản chi khác', '0');
            }
        } else {
            renderOtherCostRow('Khoản chi khác', '0');
        }
    } catch (e) {
        console.error('Error loading other costs:', e);
        renderOtherCostRow('Khoản chi khác', '0');
    }
}

function loadDayState() {
    let key = 'mealApp_Day_' + dateKey(currentDate);
    let saved = localStorage.getItem(key);
    // 1. Ưu tiên hiện dữ liệu trong máy trước cho nhanh
    if (saved) {
        let state = JSON.parse(saved);
        mealData = state.mealData;
        document.getElementById('gia-trua').value = state.priceTrua;
        document.getElementById('gia-toi').value = state.priceToi;
    } else {
        mealData = defaultMealData();
        document.getElementById('gia-trua').value = '29.500';
        document.getElementById('gia-toi').value = '29.500';
    }

    renderPersonnelList();
    calculate();
    // 2. Tự động kiểm tra trên Google Sheets xem có bản mới hơn không
    if (scriptURL) {
        try {
            const resp = await fetch(`${scriptURL}?date=${dateKey(currentDate)}`);
            const cloudData = await resp.json();

            // Nếu trên Google có dữ liệu, ghi đè vào App luôn
            if (cloudData && cloudData.length > 0) {
                mealData = cloudData;
                saveDayState(); // Lưu lại vào máy để lần sau mở nhanh hơn
                renderPersonnelList();
                calculate();
                console.log("Đã cập nhật dữ liệu mới nhất từ Google Sheets.");
            }
        } catch (e) {
            console.log("Không thể kết nối Google Sheets hoặc ngày này chưa có dữ liệu trên Cloud.");
        }
    }
}

// ===== MONTHLY TOTAL =====
function calcMonthlyTotal() {
    let mk = monthKey(currentDate);
    let total = 0;

    for (let d = 1; d <= 31; d++) {
        let dateStr = `${mk}-${String(d).padStart(2, '0')}`;
        let saved = localStorage.getItem('mealApp_Day_' + dateStr);
        if (!saved) continue;

        let state = JSON.parse(saved);
        let priceTrua = parseFormatted(state.priceTrua);
        let priceToi = parseFormatted(state.priceToi);

        let dayTrua = (state.mealData || []).filter(p => p.trua).length * priceTrua;
        let dayToi = (state.mealData || []).filter(p => p.toi).length * priceToi;

        // Sum other costs if they exist (though currently stored globally)
        // If stored globally, we only add them once for the current view or handled differently.
        // For simplicity in the monthly card, let's keep it as is.
        total += dayTrua + dayToi;
    }

    // Only meal costs — other costs are handled separately
    return total;
}

// ===== REFUND CALCULATION =====
function updateRefundSection() {
    const container = document.getElementById('refund-list-container');
    let mk = monthKey(currentDate);

    // Map of soldierId -> { name, cuts: 0, money: 0 }
    let refunds = {};

    for (let d = 1; d <= 31; d++) {
        let dateStr = `${mk}-${String(d).padStart(2, '0')}`;
        let savedRaw = localStorage.getItem('mealApp_Day_' + dateStr);
        if (!savedRaw) continue;

        let state = JSON.parse(savedRaw);
        let pTrua = parseFormatted(state.priceTrua);
        let pToi = parseFormatted(state.priceToi);

        (state.mealData || []).forEach(p => {
            if (!p.trua || !p.toi) {
                if (!refunds[p.id]) {
                    refunds[p.id] = { name: p.name, cuts: 0, money: 0 };
                }
                if (!p.trua) {
                    refunds[p.id].cuts++;
                    refunds[p.id].money += pTrua;
                }
                if (!p.toi) {
                    refunds[p.id].cuts++;
                    refunds[p.id].money += pToi;
                }
            }
        });
    }

    // Render entries
    let sortedIds = Object.keys(refunds).sort((a, b) => a - b);
    if (sortedIds.length === 0) {
        container.innerHTML = '<div style="font-size: 0.8rem; color: #999; text-align: center; padding: 10px;">Tháng này chưa có anh em nào cắt cơm.</div>';
        return;
    }

    let html = `<div class="refund-header">
        <span>Chiến sĩ</span>
        <span>Buổi</span>
        <span>Số tiền</span>
    </div>`;

    sortedIds.forEach(id => {
        let r = refunds[id];
        html += `<div class="refund-item">
            <div class="refund-name">${r.name}</div>
            <div class="refund-count">${r.cuts}</div>
            <div class="refund-amount">${new Intl.NumberFormat('vi-VN').format(r.money)}đ</div>
        </div>`;
    });

    container.innerHTML = html;
}

// ===== RENDER PERSONNEL LIST =====
function renderPersonnelList() {
    const listContainer = document.getElementById('personnel-list');
    listContainer.innerHTML = '';

    mealData.forEach((person, index) => {
        const card = document.createElement('div');
        card.className = 'person-card';

        let truaClass = person.trua ? "active" : "";
        let truaHTML = person.trua
            ? '<i class="fa-solid fa-sun" style="font-size:0.6rem;"></i> T <i class="fa-solid fa-check" style="font-size:0.5rem;"></i>'
            : '<i class="fa-solid fa-sun" style="font-size:0.6rem;"></i> T';

        let toiClass = person.toi ? "active" : "";
        let toiHTML = person.toi
            ? '<i class="fa-solid fa-moon" style="font-size:0.6rem;"></i> T <i class="fa-solid fa-check" style="font-size:0.5rem;"></i>'
            : '<i class="fa-solid fa-moon" style="font-size:0.6rem;"></i> T';

        card.innerHTML = `
            <div class="person-name">${person.name}</div>
            <div class="btn-group">
                <button class="toggle-btn btn-trua ${truaClass}" onclick="toggleMeal(${index}, 'trua', this)">
                    ${truaHTML}
                </button>
                <button class="toggle-btn btn-toi ${toiClass}" onclick="toggleMeal(${index}, 'toi', this)">
                    ${toiHTML}
                </button>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// ===== INIT =====
function init() {
    updateNavDisplay();
    loadOtherCosts(); // load once — stays fixed across day changes
    renderDayPicker();
    loadDayState();
}

// ===== TOGGLE MEAL =====
function toggleMeal(index, type, btnEl) {
    mealData[index][type] = !mealData[index][type];

    if (mealData[index][type]) {
        btnEl.classList.add('active');
        btnEl.innerHTML = type === 'trua'
            ? '<i class="fa-solid fa-sun" style="font-size:0.6rem;"></i> T <i class="fa-solid fa-check" style="font-size:0.5rem;"></i>'
            : '<i class="fa-solid fa-moon" style="font-size:0.6rem;"></i> T <i class="fa-solid fa-check" style="font-size:0.5rem;"></i>';
    } else {
        btnEl.classList.remove('active');
        btnEl.innerHTML = type === 'trua'
            ? '<i class="fa-solid fa-sun" style="font-size:0.6rem;"></i> T'
            : '<i class="fa-solid fa-moon" style="font-size:0.6rem;"></i> T';
    }

    calculate();
}

// ===== CALCULATE =====
function calculate() {
    let totalTrua = mealData.filter(p => p.trua).length;
    let totalToi = mealData.filter(p => p.toi).length;

    let priceTrua = parseFormatted(document.getElementById('gia-trua').value);
    let priceToi = parseFormatted(document.getElementById('gia-toi').value);

    let otherCost = 0;
    document.querySelectorAll('.other-cost-input').forEach(inp => {
        otherCost += parseFormatted(inp.value);
    });

    let moneyTrua = totalTrua * priceTrua;
    let moneyToi = totalToi * priceToi;
    let mealTotal = moneyTrua + moneyToi;

    // "Other Cost" is monthly, so for daily view we take the daily share
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let dailyOtherCost = otherCost / daysInMonth;

    let grandTotal = mealTotal + dailyOtherCost;
    let totalMeals = totalTrua + totalToi;
    let averageCost = totalMeals > 0 ? grandTotal / totalMeals : 0;

    // Top bar
    document.getElementById('val-bua-trua').innerText = totalTrua;
    document.getElementById('val-bua-toi').innerText = totalToi;
    document.getElementById('val-tien-com').innerText = (mealTotal / 1000).toFixed(0) + 'K';
    document.getElementById('val-chi-phi-khac-k').innerText = formatK(otherCost);
    document.getElementById('val-chi-bua-k').innerText = totalMeals > 0 ? formatK(averageCost) : '0K';

    // Monthly total (save first so today is included, then refresh picker colors)
    saveDayState();
    renderDayPicker();
    updateRefundSection(); // Update refund list
    let monthMealTotal = calcMonthlyTotal();
    document.getElementById('val-tien-thang').innerText = formatK(monthMealTotal);

    // TỔNG CUỐI THÁNG với độ chính xác tuyệt đối
    let monthlyGrandTotal = monthMealTotal + otherCost;
    document.getElementById('f-tong-cuoi-thang').innerText = formatAverageExact(monthlyGrandTotal);

    // Pricing area
    document.getElementById('val-tong-2-bua').innerText = formatCurrency(priceTrua + priceToi);

    // Footer
    document.getElementById('f-tien-trua').innerText = formatCurrency(moneyTrua);
    document.getElementById('f-tien-toi').innerText = formatCurrency(moneyToi);
    document.getElementById('f-chi-phi-khac').innerText = formatCurrency(Math.round(dailyOtherCost));
    document.getElementById('f-tong-cong').innerText = formatCurrency(Math.round(grandTotal));
    document.getElementById('f-tong-bua').innerText = totalMeals + ' bữa';
    document.getElementById('f-chi-tb').innerText = formatAverageExact(averageCost);
}

// ===== FORMATTERS =====
function formatK(value) {
    let k = value / 1000;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K';
}

function formatCurrency(number) {
    return new Intl.NumberFormat('vi-VN').format(number) + 'đ';
}

function formatAverageExact(number) {
    if (number === 0) return '0đ';
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(number) + 'đ';
}

function parseFormatted(val) {
    if (!val) return 0;
    return parseInt(String(val).replace(/\./g, '')) || 0;
}

// ===== PRICE INPUT HANDLERS =====
function handlePriceKey(event, inputEl) {
    if (event.key === 'Enter') {
        confirmPrice(inputEl);
        inputEl.blur();
    }
}

function confirmPrice(inputEl) {
    let raw = inputEl.value.trim();
    if (raw === '') { calculate(); return; }

    // If already has a dot — user typed it manually, leave as is
    if (raw.includes('.')) {
        calculate();
        return;
    }

    // No dot: append .000
    let digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly === '') { calculate(); return; }

    let num = parseInt(digitsOnly, 10);
    inputEl.value = new Intl.NumberFormat('vi-VN').format(num) + '.000';
    calculate();
}

// Variant for other-cost inputs: also saves to mealApp_OtherCosts
function confirmPriceAndSave(inputEl) {
    confirmPrice(inputEl);
    saveOtherCosts();
}

// ===== OTHER COSTS =====
function renderOtherCostRow(nameValue, costValue) {
    const container = document.getElementById('other-costs-container');
    const row = document.createElement('div');
    row.className = 'other-cost-item';
    row.style.cssText = 'display:flex; gap:10px; margin-bottom:8px; align-items:center;';

    row.innerHTML = `
        <input type="text" class="other-cost-name" placeholder="Ví dụ: Tiền rau, thịt..." style="flex:1.5;" value="${nameValue}" oninput="saveOtherCosts()">
        <input type="text" class="other-cost-input" style="flex:1;" value="${costValue}"
            onkeydown="handlePriceKey(event, this)"
            onblur="confirmPriceAndSave(this)">
        <button onclick="removeOtherCost(this)" style="background:none;border:none;color:var(--red);font-size:1.1rem;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);

    row.querySelectorAll('input').forEach(inp => {
        inp.style.padding = '8px 12px';
        inp.style.fontFamily = "'Roboto', sans-serif";
        inp.style.fontSize = '1rem';
        inp.style.border = '1px solid var(--border-color)';
        inp.style.outline = 'none';
        inp.style.borderRadius = '0';
    });
}

function addOtherCost() {
    renderOtherCostRow('', '1.000');
    saveOtherCosts();
    calculate();
}

function removeOtherCost(btnEl) {
    btnEl.closest('.other-cost-item').remove();
    saveOtherCosts();
    calculate();
}

// ===== DATA SYNC (GOOGLE SHEETS) =====
function syncData() {
    if (!scriptURL) return;

    // Gửi kèm cả Ngày đang xem để Google Sheet biết ghi vào đâu
    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
            date: dateKey(currentDate), // Gửi ngày hiện tại
            data: mealData
        })
    }).then(() => console.log('Đã đồng bộ lên Google.'));
}

// ===== SAVE BUTTON (toast + log) =====
function saveData() {
    // Force blur any active input to ensure its individual save logic triggers
    if (document.activeElement && (document.activeElement.tagName === 'INPUT')) {
        document.activeElement.blur();
    }

    saveDayState();
    saveOtherCosts(); // Ensure other costs are also saved
    syncData(); // Đồng bộ lên Google Sheets

    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
    console.log('Data saved for', dateKey(currentDate));
}

// ===== LOGOUT =====
function doLogout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// ===== RESET & RELOAD (cập nhật danh sách mới) =====
function resetAndReload() {
    if (confirm('⚠️ Xác nhận xóa toàn bộ dữ liệu cũ và tải lại danh sách 27 chiến sĩ mới?\n\nHành động này không thể hoàn tác!')) {
        localStorage.clear();
        location.reload();
    }
}

// ===== START =====
init();
