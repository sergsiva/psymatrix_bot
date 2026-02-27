const tg = window.Telegram.WebApp;
tg.expand();

// ========== УПРАВЛЕНИЕ ЭКРАНАМИ ==========
const screens = {
    input: document.getElementById('inputScreen'),
    loading: document.getElementById('loadingScreen'),
    result: document.getElementById('resultScreen')
};

function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        if (screens[key]) screens[key].classList.remove('active');
    });
    if (screens[screenName]) screens[screenName].classList.add('active');
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    showScreen('input');
    
    document.getElementById('calculateBtn').addEventListener('click', calculateMatrix);
    document.getElementById('newCalcBtn').addEventListener('click', () => showScreen('input'));
    
    initDateFormatter();
});

function initDateFormatter() {
    const input = document.getElementById('birthdate');
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 3 && value.length <= 4) {
            value = value.slice(0, 2) + '.' + value.slice(2);
        } else if (value.length >= 5) {
            value = value.slice(0, 2) + '.' + value.slice(2, 4) + '.' + value.slice(4, 8);
        }
        e.target.value = value.slice(0, 10);
    });
}

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ РАСЧЕТА
// ============================================
function calculateMatrix() {
    const birthdate = document.getElementById('birthdate').value;
    
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(birthdate)) {
        tg.showAlert('❌ Введите дату в формате ДД.ММ.ГГГГ');
        return;
    }
    
    showScreen('loading');
    
    // ОТКРЫВАЕМ ТВОЕГО БОТА С ДАТОЙ
    tg.openTelegramLink(`https://t.me/psycodematrix_bot?start=${birthdate}`);
    
    // Показываем тестовый результат через 2 секунды
    setTimeout(() => {
        const testResult = {
            date: birthdate,
            matrix: {1:3, 2:1, 3:2, 4:1, 5:2, 6:0, 7:2, 8:1, 9:1},
            work_numbers: [37, 10, 35, 8]
        };
        displayResult(testResult);
    }, 2000);
}

function displayResult(result) {
    console.log("Результат:", result);
    
    document.getElementById('resultDate').textContent = result.date;
    
    displayMatrix(result.matrix);
    displayWorkNumbers(result.work_numbers);
    
    showScreen('result');
}

function displayMatrix(matrix) {
    const grid = document.getElementById('matrixGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const order = [1, 4, 7, 2, 5, 8, 3, 6, 9];
    
    order.forEach(digit => {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerHTML = `
            <span class="matrix-digit">${digit}</span>
            <span class="matrix-count">${matrix[digit] || 0}</span>
        `;
        grid.appendChild(cell);
    });
}

function displayWorkNumbers(numbers) {
    const grid = document.getElementById('workNumbers');
    if (!grid) return;
    
    grid.innerHTML = '';
    const labels = ['РЧ1', 'РЧ2', 'РЧ3', 'РЧ4'];
    
    labels.forEach((label, index) => {
        const item = document.createElement('div');
        item.className = 'number-item';
        item.innerHTML = `
            <span class="number-label">${label}</span>
            <span class="number-value">${numbers[index]}</span>
        `;
        grid.appendChild(item);
    });
}