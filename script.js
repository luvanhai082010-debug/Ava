// script.js - Logic Game Tĩnh (Client-side)

// --- TRẠNG THÁI GAME & THÔNG SỐ CỐ ĐỊNH ---
let gameState = {
    state: 'PREPARING', // PREPARING, RUNNING, CRASHED
    balance: 50000.00,
    planeY: 0,          // Độ cao hiện tại (tính theo pixel)
    planeX: 0,          // Khoảng cách đã bay (tính theo mét)
    currentMultiplier: 1.00, // Hệ số tích lũy
    selectedBetAmount: 10000, // Số tiền cược đang chọn
    isBetActive: false,
    gameInterval: null,
    
    // Thuộc tính vật lý
    BASE_DROP_RATE: 0.15, // Tốc độ giảm độ cao cơ bản (pixels/tick)
    CANNON_BOOST: 50,     // Lượng tăng độ cao khi bắn pháo (pixels)
    MAX_ALTITUDE: 250,    // Độ cao tối đa
    BASE_SPEED: 0.5       // Tốc độ bay ngang (meters/tick)
};

const CANNON_COST = 500;

// --- CƠ SỞ DỮ LIỆU CODE THƯỞNG (Ẩn) ---
const rewardCodes = {
    'lvh1k': { amount: 1000, claimed: false }, 
    'lvh3k': { amount: 3000, claimed: false }, 
    'lvh2010': { amount: 58000, claimed: false }, 
    '1': { amount: 58000, claimed: false }, 
};


// --- DOM ELEMENTS ---
const planeElement = document.getElementById('plane');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const altitudeDisplay = document.getElementById('altitudeDisplay');
const distanceDisplay = document.getElementById('distanceDisplay');
const balanceDisplay = document.getElementById('balanceDisplay');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const messageArea = document.getElementById('messageArea');

const playBtn = document.getElementById('playBtn');
const playText = document.getElementById('playText');
const cannonBtn = document.getElementById('cannonBtn');
const quickBetButtons = document.querySelectorAll('.quick-bet-btn');

// Popup Elements
const smallRewardTrigger = document.getElementById('smallRewardTrigger');
const rewardModal = document.getElementById('rewardModal');
const closeModalBtn = document.querySelector('.close-btn');
const rewardCodeInput = document.getElementById('rewardCodeInput');
const confirmCodeBtn = document.getElementById('confirmCodeBtn');
const codeMessage = document.getElementById('codeMessage');


// --- HÀM TIỆN ÍCH ---

function formatVND(amount) {
    return Math.floor(amount).toLocaleString('vi-VN') + ' VNĐ';
}

function updateUI() {
    balanceDisplay.textContent = formatVND(gameState.balance);
    altitudeDisplay.textContent = `${(gameState.planeY / 10).toFixed(1)}m`; // Scale độ cao
    distanceDisplay.textContent = `${gameState.planeX.toFixed(1)}m`;
    multiplierDisplay.textContent = `x${gameState.currentMultiplier.toFixed(2)}`;
    
    // Cập nhật vị trí máy bay (Dùng transform để animation mượt mà)
    // Tính toán tỷ lệ phần trăm độ cao (planeY = 0 là đáy, MAX_ALTITUDE là đỉnh)
    const altitudeRatio = gameState.planeY / gameState.MAX_ALTITUDE;
    const gameAreaHeight = document.getElementById('game-area').offsetHeight;
    const planeY_px = gameAreaHeight - (gameState.planeY + 100); // 100 là offset tàu sân bay/plane size

    planeElement.style.transform = `translateY(${planeY_px}px)`;
}

// Hàm giả lập va chạm/hệ số ngẫu nhiên (chưa triển khai chi tiết)
function generateRandomMultipliers() {
    // Trong phiên bản này, chỉ cần tăng hệ số theo thời gian (giả lập)
    if (gameState.planeX % 10 === 0 && gameState.planeX > 0) {
        const boost = Math.floor(Math.random() * 50) + 10;
        gameState.planeY = Math.min(gameState.MAX_ALTITUDE, gameState.planeY + boost);
        
        const multIncrease = Math.random() * 0.5 + 0.5; // Tăng từ 0.5x đến 1.0x
        gameState.currentMultiplier += multIncrease;
        messageArea.textContent = `Chạm Hệ số! +${multIncrease.toFixed(2)}x`;
    }
}


// --- LOGIC GAME LOOP ---

function startGame() {
    gameState.state = 'RUNNING';
    gameState.planeX = 0;
    gameState.planeY = gameState.MAX_ALTITUDE; // Bắt đầu ở độ cao tối đa
    gameState.currentMultiplier = 1.00;
    
    // Cập nhật nút
    playBtn.classList.remove('wait-state');
    playBtn.classList.add('cashout-state');
    playText.textContent = 'RÚT TIỀN';
    cannonBtn.disabled = false;
    
    gameState.gameInterval = setInterval(() => {
        // 1. Giảm độ cao dần dần
        gameState.planeY -= gameState.BASE_DROP_RATE;
        
        // 2. Tăng khoảng cách
        gameState.planeX += gameState.BASE_SPEED;
        
        // 3. Giả lập chạm hệ số
        generateRandomMultipliers();

        // 4. Kiểm tra THUA (Máy bay chạm đất/biển)
        if (gameState.planeY <= 0) {
            handleCrash();
            return;
        }

        updateUI();

    }, 10); // Cập nhật 100 lần/giây
}

function handleCrash() {
    clearInterval(gameState.gameInterval);
    gameState.state = 'CRASHED';
    
    // Xử lý thua cược (tiền cược đã trừ lúc đặt cược)
    messageArea.textContent = `Máy bay rơi! Bạn đã thua ${formatVND(gameState.bet.amount)}.`;
    gameState.isBetActive = false;
    
    // Reset và chờ vòng mới
    resetGameControls();
    setTimeout(startNewRound, 3000);
}

function startNewRound() {
    gameState.state = 'PREPARING';
    gameState.planeY = 0;
    gameState.planeX = 0;
    gameState.currentMultiplier = 1.00;
    gameState.isBetActive = false;
    
    messageArea.textContent = 'Sẵn sàng đặt cược vòng mới.';
    
    resetGameControls();
    updateUI();
}

function resetGameControls() {
    // Cập nhật nút Play
    playBtn.classList.remove('cashout-state', 'wait-state');
    playBtn.classList.add('start-state');
    playText.textContent = 'ĐẶT CƯỢC';
    
    // Mở khóa các nút cược nhanh
    quickBetButtons.forEach(btn => btn.disabled = false);
    cannonBtn.disabled = true;
}


// --- XỬ LÝ SỰ KIỆN NÚT ---

// 1. Logic Chọn Cược Nhanh
quickBetButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        quickBetButtons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        gameState.selectedBetAmount = parseFloat(e.currentTarget.dataset.amount);
        currentBetDisplay.textContent = formatVND(gameState.selectedBetAmount);
    });
});

// 2. Logic Nút PLAY (Đặt cược)
playBtn.addEventListener('click', () => {
    if (gameState.state === 'PREPARING') {
        const amount = gameState.selectedBetAmount;
        
        if (gameState.balance < amount) {
            messageArea.textContent = 'Số dư không đủ để đặt cược.';
            return;
        }

        // Đặt cược
        gameState.balance -= amount;
        gameState.bet = { amount, cashedOut: false };
        gameState.isBetActive = true;
        
        messageArea.textContent = `Đã đặt cược ${formatVND(amount)}. Bắt đầu bay...`;
        
        // Cập nhật giao diện cược và nút Play
        quickBetButtons.forEach(btn => btn.disabled = true);
        
        playBtn.classList.remove('start-state');
        playBtn.classList.add('wait-state');
        playText.textContent = 'ĐANG BAY...';

        updateUI();
        startGame(); // Bắt đầu game ngay sau khi đặt cược
        
    } else if (gameState.state === 'RUNNING' && gameState.isBetActive) {
        // Rút tiền/Hạ cánh thành công
        const winnings = gameState.bet.amount * gameState.currentMultiplier;
        gameState.balance += winnings;
        gameState.bet.cashedOut = true;

        clearInterval(gameState.gameInterval);
        gameState.state = 'CRASHED';
        
        messageArea.textContent = `Hạ cánh thành công! Thắng ${formatVND(winnings)}.`;
        
        resetGameControls();
        updateUI();
        setTimeout(startNewRound, 3000);
    }
});

// 3. Logic Bắn Pháo
cannonBtn.addEventListener('click', () => {
    if (gameState.state === 'RUNNING' && gameState.balance >= CANNON_COST) {
        gameState.balance -= CANNON_COST;
        gameState.planeY = Math.min(gameState.MAX_ALTITUDE, gameState.planeY + gameState.CANNON_BOOST);
        messageArea.textContent = `Đã bắn pháo! +${gameState.CANNON_BOOST / 10}m độ cao.`;
        updateUI();
    } else if (gameState.state === 'RUNNING' && gameState.balance < CANNON_COST) {
         messageArea.textContent = 'Không đủ tiền (500 VNĐ) để bắn pháo.';
    }
});


// --- LOGIC MÃ THƯỞNG ---

// Mở Popup
smallRewardTrigger.addEventListener('click', () => {
    rewardModal.style.display = 'block';
    codeMessage.textContent = ''; 
    rewardCodeInput.value = '';
    confirmCodeBtn.disabled = true;
    confirmCodeBtn.classList.remove('active-confirm');
});

// Đóng Popup
closeModalBtn.addEventListener('click', () => { rewardModal.style.display = 'none'; });
window.addEventListener('click', (event) => {
    if (event.target == rewardModal) { rewardModal.style.display = 'none'; }
});

// Hiệu ứng Nút Xác Nhận
rewardCodeInput.addEventListener('input', () => {
    if (rewardCodeInput.value.trim().length > 0) {
        confirmCodeBtn.disabled = false;
        confirmCodeBtn.classList.add('active-confirm');
    } else {
        confirmCodeBtn.disabled = true;
        confirmCodeBtn.classList.remove('active-confirm');
    }
});

// Xác nhận Code Thưởng
confirmCodeBtn.addEventListener('click', () => {
    const code = rewardCodeInput.value.toLowerCase().trim();
    codeMessage.className = 'message';
    codeMessage.textContent = '';

    if (rewardCodes.hasOwnProperty(code)) {
        const reward = rewardCodes[code];

        if (reward.claimed) {
            codeMessage.textContent = `Mã ${code.toUpperCase()} đã được sử dụng.`;
            codeMessage.classList.add('error');
            return;
        }

        // Xử lý Thưởng
        gameState.balance += reward.amount;
        reward.claimed = true; 
        updateUI(); 
        
        codeMessage.textContent = `Thành công! Bạn nhận được ${formatVND(reward.amount)}.`;
        codeMessage.classList.add('success');
        
        setTimeout(() => {
            rewardModal.style.display = 'none';
        }, 2000);

    } else {
        codeMessage.textContent = 'Mã thưởng không hợp lệ.';
        codeMessage.classList.add('error');
    }
});


// --- KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    startNewRound(); // Bắt đầu vòng đặt cược đầu tiên
});
