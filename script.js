// --- 1. CẤU HÌNH & BIẾN TOÀN CỤC ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxB3OxE4B1vLrNQaT22puxqB4eX4-3XW2XaV0X6UKc2-k8x6mVdQt6WlCD5Z_oifIxJ8g/exec';
const STATUS = { NEW: "MỚI", PROCESSING: "Đ.XỬ LÝ", EXPIRED: "HẾT HẠN" };
const fieldsToWatch = ['customer', 'product_name', 'quantity', 'packing'];

let allOrders = [
    { id: 'ORD-260211-X4K2', customer: 'TƯƠI MART', product: 'Trà atiso túi lọc', status: STATUS.NEW },
    { id: 'ORD-260210-9Z1M', customer: 'KOSAME', product: 'Cao nước atiso', status: STATUS.PROCESSING }
];

// --- 2. KHỞI CHẠY HỆ THỐNG (WINDOW ONLOAD) ---
window.onload = () => {
    const orderIDInput = document.getElementById('displayOrderID');
    if(orderIDInput) orderIDInput.value = ""; // Đảm bảo trống khi bắt đầu
    
    renderOrderHistory(allOrders);
    loadMockData();
    
    // Gán sự kiện lắng nghe cho các ô nhập liệu
    fieldsToWatch.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', checkAndGenerateID);
    });
};

// --- 3. LOGIC TỰ ĐỘNG SINH MÃ ID ---
function checkAndGenerateID() {
    const orderIDInput = document.getElementById('displayOrderID');
    // Kiểm tra xem tất cả các ô đã được điền chưa
    const isAllFilled = fieldsToWatch.every(id => {
        const val = document.getElementById(id).value.trim();
        return val !== "" && val !== "0";
    });

    if (isAllFilled) {
        // Chỉ tạo mã mới nếu ô ID đang trống
        if (!orderIDInput.value) {
            orderIDInput.value = generateOrderID();
            orderIDInput.style.animation = "pulse-gold 1s ease";
            setTimeout(() => orderIDInput.style.animation = "", 1000);
        }
    } else {
        // Nếu người dùng xóa bớt thông tin, xóa luôn ID
        orderIDInput.value = ""; 
    }
}

function generateOrderID() {
    const now = new Date();
    const datePart = now.getFullYear().toString().slice(-2) + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
}

// --- 4. XỬ LÝ SUBMIT (GỬI ĐƠN HÀNG) ---
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const btn = this.querySelector('.btn-submit');
        const orderIDInput = document.getElementById('displayOrderID');
        const originalText = btn.innerText;

        btn.innerText = "🚀 SENDING TO GALAXY...";
        btn.disabled = true;

        // Thu thập dữ liệu
        const orderData = {
            orderID: orderIDInput.value,
            customer: document.getElementById('customer').value,
            product: document.getElementById('product_name').value,
            quantity: document.getElementById('quantity').value,
            packing: document.getElementById('packing').value
        };

        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(orderData)
        })
        .then(() => {
            alert("✨ ORDER CONFIRMED!");

            // 1. Thêm vào lịch sử hiển thị
            allOrders.unshift({
                id: orderData.orderID,
                customer: orderData.customer,
                product: orderData.product,
                status: STATUS.NEW
            });
            renderOrderHistory(allOrders);

            // 2. Reset Form và ID
            orderForm.reset(); 
            orderIDInput.value = ""; // Quan trọng: Trả về trống để chờ đơn tiếp theo
            
            // 3. Khôi phục nút bấm
            btn.innerText = originalText;
            btn.disabled = false;
        })
        .catch(err => {
            console.error('Error:', err);
            alert("❌ Lỗi kết nối vũ trụ!");
            btn.innerText = originalText;
            btn.disabled = false;
        });
    });
}

// --- 5. CÁC HÀM PHỤ TRỢ (HELPER FUNCTIONS) ---

function renderOrderHistory(orders) {
    const tableBody = document.querySelector('#orderHistoryTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = orders.map(order => {
        let sClass = order.status === STATUS.NEW ? 'status-new' : 
                     order.status === STATUS.PROCESSING ? 'status-processing' : 'status-expired';
        return `
            <tr>
                <td><b style="color:var(--accent)">${order.id}</b></td>
                <td>${order.customer}</td>
                <td>${order.product}</td>
                <td><span class="status-pill ${sClass}">${order.status}</span></td>
                <td><button class="btn-mini">Detail</button></td>
            </tr>`;
    }).join('');
}

// Chuyển đổi Tab
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');
    });
});

// Bộ lọc
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterValue = btn.getAttribute('data-filter');
        const filtered = filterValue === 'all' ? allOrders : allOrders.filter(o => o.status === filterValue);
        renderOrderHistory(filtered);
    });
});

function loadMockData() {
    const mes = document.querySelector('#mesTable tbody');
    if (mes) mes.innerHTML = `<tr><td>B-2026-001</td><td><span class="status-pill status-processing">Nấu cao</span></td><td>85%</td></tr>`;
    const wms = document.querySelector('#wmsTable tbody');
    if (wms) wms.innerHTML = `<tr><td>ATI-50-T1</td><td>1,250</td><td>Zone A-12</td></tr>`;
}
