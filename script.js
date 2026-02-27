// --- 1. CẤU HÌNH & BIẾN TOÀN CỤC ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzexJMErjjqqrKJ2wrN1CGCdZayCjkzRI0t4sw7H2PiP3bM2qwc4nVOHYSjM7EkITsIPA/exec';
const STATUS = { NEW: "MỚI", PROCESSING: "Đ.XỬ LÝ", EXPIRED: "HẾT HẠN" };
const fieldsToWatch = ['customer', 'product_name', 'quantity', 'packing'];

let allOrders = [
    { id: 'ORD-260211-X4K2', customer: 'TƯƠI MART', product: 'Trà atiso túi lọc', status: STATUS.NEW },
    { id: 'ORD-260210-9Z1M', customer: 'KOSAME', product: 'Cao nước atiso', status: STATUS.PROCESSING }
];

// --- 2. KHỞI CHẠY HỆ THỐNG (WINDOW ONLOAD) ---
window.onload = () => {
    const orderIDInput = document.getElementById('displayOrderID');
    if(orderIDInput) orderIDInput.value = ""; 
    
    renderOrderHistory(allOrders);
    loadMockData();
    
    // --- LẮNG NGHE SỰ KIỆN HỢP NHẤT ---
    // Thay vì lặp qua từng ô, ta lắng nghe toàn bộ sự kiện nhập liệu trên trang
    document.addEventListener('input', (e) => {
        // 1. Nếu gõ vào ô Tên khách hàng (id="customer")
        // 2. HOẶC gõ vào bất kỳ ô Tên sản phẩm nào có class "p-name"
        if (e.target.id === 'customer' || e.target.classList.contains('p-name')) {
            checkAndGenerateID();
        }
    });
};
// --- 3. LOGIC TỰ ĐỘNG SINH MÃ ID (PHIÊN BẢN HỢP NHẤT) ---
function checkAndGenerateID() {
    const orderIDInput = document.getElementById('displayOrderID');
    if (!orderIDInput) return;

    // 1. Lấy tên khách hàng
    const customer = document.getElementById('customer').value.trim();
    
    // 2. Lấy tên sản phẩm ở DÒNG ĐẦU TIÊN của bảng
    const firstRowProduct = document.querySelector('.p-name');
    const productName = firstRowProduct ? firstRowProduct.value.trim() : "";

    // 3. Điều kiện sinh mã: Có khách hàng VÀ có tên sản phẩm đầu tiên
    if (customer !== "" && productName !== "") {
        // Chỉ tạo mã mới nếu ô ID đang trống
        if (!orderIDInput.value) {
            orderIDInput.value = generateOrderID();
            
            // Hiệu ứng nháy sáng cho chuyên nghiệp
            orderIDInput.style.border = "1px solid var(--accent)";
            orderIDInput.style.boxShadow = "0 0 15px var(--accent)";
            setTimeout(() => {
                orderIDInput.style.boxShadow = "none";
            }, 1000);
        }
    } else {
        // Nếu xóa trắng thông tin cốt lõi thì xóa luôn ID
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

// --- 4.XỬ LÝ SUBMIT HỢP NHẤT (CHO NHIỀU SẢN PHẨM) ---
const orderForm = document.getElementById('orderForm');

if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const btn = this.querySelector('.btn-submit');
        const orderIDInput = document.getElementById('displayOrderID');
        const originalText = btn.innerText;

        // 1. Kiểm tra ID đã được sinh ra chưa
        if (!orderIDInput.value) {
            alert("Vui lòng điền đủ thông tin để hệ thống tạo mã Order ID!");
            return;
        }

        btn.innerText = "🚀 SENDING TO GALAXY...";
        btn.disabled = true;

        // 2. Thu thập danh sách sản phẩm từ các dòng
        const items = [];
        document.querySelectorAll('.item-row').forEach(row => {
            items.push({
                name: row.querySelector('.p-name').value,
                qty: row.querySelector('.p-qty').value,
                packing: row.querySelector('.p-packing').value
            });
        });

        // 3. Gom dữ liệu cuối cùng
        const orderData = {
            orderID: orderIDInput.value,
            customer: document.getElementById('customer').value,
            products: items, // Đây là mảng chứa nhiều sản phẩm
            timestamp: new Date().toLocaleString('vi-VN')
        };

        // 4. Gửi lên Google Sheets (Web App)
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Chế độ này không trả về nội dung response nhưng vẫn gửi data thành công
            body: JSON.stringify(orderData)
        })
        .then(() => {
            alert("✨ ORDER CONFIRMED!");

            // Cập nhật giao diện lịch sử (Hiển thị sản phẩm đầu tiên kèm ghi chú "+ thêm...")
            allOrders.unshift({
                id: orderData.orderID,
                customer: orderData.customer,
                product: items[0].name + (items.length > 1 ? ` (+${items.length - 1} món)` : ""),
                status: STATUS.NEW
            });
            renderOrderHistory(allOrders);

            // Reset Form: Xóa các dòng phụ, chỉ để lại 1 dòng trống
            orderForm.reset();
            const itemsBody = document.getElementById('itemsBody');
            itemsBody.innerHTML = `
                <tr class="item-row">
                    <td><input type="text" class="p-name" placeholder="Tên SP" required></td>
                    <td><input type="number" class="p-qty" placeholder="0" required></td>
                    <td><input type="text" class="p-packing" placeholder="50 gói/thùng"></td>
                    <td><button type="button" class="btn-remove" onclick="removeRow(this)">✕</button></td>
                </tr>
            `;
            orderIDInput.value = "";
            
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
// --- XỬ LÝ NÚT THÊM DÒNG VÀ XÓA DÒNG (Hợp nhất & Sửa lỗi) ---
document.addEventListener('click', function(e) {
    // 1. Xử lý Thêm dòng
    if (e.target && e.target.id === 'addRowBtn') {
        const tbody = document.getElementById('itemsBody');
        const newRow = document.createElement('tr');
        newRow.className = 'item-row';
        // LƯU Ý: Đã bỏ onclick trong button để dùng Listener bên dưới
        newRow.innerHTML = `
            <td><input type="text" class="p-name" placeholder="Tên SP" required></td>
            <td><input type="number" class="p-qty" placeholder="0" required></td>
            <td><input type="text" class="p-packing" placeholder="50 gói/thùng"></td>
            <td><button type="button" class="btn-remove">✕</button></td>
        `;
        tbody.appendChild(newRow);
    }

    // 2. Xử lý Xóa dòng (Sửa lỗi Uncaught ReferenceError)
    if (e.target && e.target.classList.contains('btn-remove')) {
        const rows = document.querySelectorAll('.item-row');
        if (rows.length > 1) {
            e.target.closest('tr').remove();
            checkAndGenerateID(); // Cập nhật lại mã ID nếu cần
        } else {
            alert("⚠️ Đơn hàng phải có ít nhất 1 sản phẩm!");
        }
    }
});
