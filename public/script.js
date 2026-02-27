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

async function calculateMatrix() {
    const birthdate = document.getElementById('birthdate').value;
    
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(birthdate)) {
        tg.showAlert('❌ Введите дату в формате ДД.ММ.ГГГГ');
        return;
    }
    
    showScreen('loading');
    
    try {
        tg.sendData(JSON.stringify({ birthdate: birthdate }));
        
        Telegram.WebApp.onEvent('webAppData', (eventData) => {
            try {
                const result = JSON.parse(eventData.data);
                if (result.error) {
                    tg.showAlert('❌ ' + result.error);
                    showScreen('input');
                } else {
                    displayResult(result);
                }
            } catch (e) {
                console.error(e);
                showScreen('input');
            }
        });
        
        setTimeout(() => {
            tg.showAlert('⚠️ Бот не ответил. Попробуйте позже.');
            showScreen('input');
        }, 10000);
        
    } catch (error) {
        console.error(error);
        showScreen('input');
    }
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