// --- 1. CẤU HÌNH HỆ THỐNG ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby2H3dlWt8DQfMLkiQzm87grFJQ1jHa4kTOLkROYP-Ej6-MOdILJoqOCOMqt0seeWNrFQ/exec';
const STATUS = { NEW: "Mới", PROCESSING: "Đang xử lý", EXPIRED: "Hết hạn" };

// Dữ liệu mẫu hiển thị ban đầu
let allOrders = [
    { id: 'ORD-260211-X4K2', customer: 'TƯƠI MART', product: 'Trà atiso thượng hạng túi lọc', status: STATUS.NEW },
    { id: 'ORD-260210-9Z1M', customer: 'KOSAME', product: 'Cao nước atiso không đường', status: STATUS.PROCESSING },
    { id: 'ORD-260205-5L9P', customer: 'KAA', product: 'Trà atiso thượng hạng túi lọc', status: STATUS.EXPIRED }
];

// --- 2. KHỞI CHẠY KHI TRANG LOAD XONG ---
window.onload = () => {
    // Tự động tạo mã đơn hàng cho ô Input
    refreshOrderID();
    
    // Hiển thị dữ liệu lên bảng
    renderOrderHistory(allOrders);
    
    // Load dữ liệu giả lập cho các bảng phụ
    loadMockData();
    
    console.log("🚀 Hệ thống Celestial OMS đã sẵn sàng!");
};

// --- 3. CÁC HÀM HỖ TRỢ (HELPER FUNCTIONS) ---

// Hàm tạo mã ID ngẫu nhiên: ORD-YYMMDD-XXXX
function generateOrderID() {
    const now = new Date();
    const datePart = now.getFullYear().toString().slice(-2) + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
}

// Cập nhật mã ID mới vào ô Input
function refreshOrderID() {
    const orderInput = document.getElementById('displayOrderID');
    if (orderInput) {
        orderInput.value = generateOrderID();
    }
}

// Hàm render dữ liệu ra bảng HTML
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

// --- 4. XỬ LÝ SỰ KIỆN (EVENTS) ---

// Chuyển đổi giữa các Tab (Tạo đơn / Theo dõi)
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        // Cập nhật trạng thái nút
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Cập nhật hiển thị nội dung
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');
    });
});

// Lọc đơn hàng theo trạng thái
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filterValue = btn.getAttribute('data-filter');
        const filtered = filterValue === 'all' ? allOrders : allOrders.filter(o => o.status === filterValue);
        renderOrderHistory(filtered);
    });
});

// XỬ LÝ GỬI FORM LÊN GOOGLE SHEETS
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // KHAI BÁO btn Ở ĐÂY ĐỂ CẢ ĐOẠN DƯỚI DÙNG ĐƯỢC
        const btn = this.querySelector('.btn-submit'); 
        const originalText = btn.innerText;
        
        btn.innerText = "🚀 SENDING TO GALAXY...";
        btn.disabled = true;

        const orderData = {
            orderID: document.getElementById('displayOrderID').value,
            customer: document.getElementById('customer').value,
            product: document.getElementById('product_name').value,
            quantity: document.getElementById('quantity').value,
            packing: document.getElementById('packing').value
        };

        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        })
            .then(() => {
                // Lấy giá trị ID thực tế lúc vừa bấm nút
                const currentID = document.getElementById('displayOrderID').value;
                const currentCustomer = document.getElementById('customer').value;
                const currentProduct = document.getElementById('product_name').value;

                alert("✨ ORDER CONFIRMED!");

                // ĐƯA DỮ LIỆU VÀO MẢNG ĐỂ HIỂN THỊ LÊN BẢNG
                allOrders.unshift({
                    id: currentID, // Dùng đúng cái ID vừa tạo
                    customer: currentCustomer,
                    product: currentProduct,
                    status: STATUS.NEW
                });

                // Cập nhật lại bảng ngay lập tức
                renderOrderHistory(allOrders);

                // Reset Form
                orderForm.reset(); 
                
                // TẠO ID MỚI CHO ĐƠN TIẾP THEO (Quan trọng)
                refreshOrderID(); 

                btn.innerText = originalText;
                btn.disabled = false;
            })
            
        .catch(error => {
            console.error('Error:', error);
            alert("❌ Lỗi kết nối vũ trụ!");
            
            // Sửa lỗi 'btn is not defined' ở đây
            if (btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    });
}

// Giả lập dữ liệu MES/WMS cho Tab Theo dõi
function loadMockData() {
    const mes = document.querySelector('#mesTable tbody');
    if (mes) mes.innerHTML = `<tr><td>B-2026-001</td><td><span class="status-pill status-processing">Nấu cao</span></td><td>85%</td></tr>`;
    
    const wms = document.querySelector('#wmsTable tbody');
    if (wms) wms.innerHTML = `<tr><td>ATI-50-T1</td><td>1,250</td><td>Zone A-12</td></tr>`;
}
