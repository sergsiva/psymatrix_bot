const http = require('http');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;

// Инициализация бота
const bot = new TelegramBot(TOKEN, { polling: true });

// ============================================
// СЕРВЕР ДЛЯ РАЗДАЧИ СТАТИКИ (Mini App)
// ============================================

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`Запрос: ${req.url}`);
  
  let url = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, 'public', url);
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'text/plain';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`📱 Mini App доступен по адресу: http://localhost:${PORT}`);
});

// ============================================
// ФУНКЦИЯ РАСЧЁТА МАТРИЦЫ
// ============================================

function calculateMatrix(birthdate) {
  try {
    const [day, month, year] = birthdate.split('.').map(Number);
    
    // Цифры даты
    const digits = [];
    [day, month, year].forEach(num => {
      num.toString().split('').forEach(d => digits.push(parseInt(d)));
    });
    
    // Рабочие числа
    const work1 = digits.reduce((a, b) => a + b, 0);
    const work2 = work1.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    const firstDigitDay = parseInt(day.toString()[0]);
    const work3 = work1 - 2 * firstDigitDay;
    const work4 = work3.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    
    // Все цифры для матрицы
    const allDigits = [...digits];
    [work1, work2, work3, work4].forEach(num => {
      num.toString().split('').forEach(d => allDigits.push(parseInt(d)));
    });
    
    // Матрица
    const matrix = {};
    for (let i = 1; i <= 9; i++) {
      matrix[i] = allDigits.filter(d => d === i).length;
    }
    
    return {
      success: true,
      date: `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`,
      work_numbers: [work1, work2, work3, work4],
      matrix: matrix
    };
  } catch (e) {
    return { success: false, error: 'Неверный формат даты' };
  }
}

// ============================================
// ФУНКЦИЯ ФОРМАТИРОВАНИЯ РЕЗУЛЬТАТА
// ============================================

function formatResult(result) {
  const m = result.matrix;
  return `
✅ *Расчет готов!*
📅 *Дата:* ${result.date}

*Матрица:*
${m[1]} | ${m[4]} | ${m[7]}
${m[2]} | ${m[5]} | ${m[8]}
${m[3]} | ${m[6]} | ${m[9]}

*Рабочие числа:*
РЧ1 = ${result.work_numbers[0]}
РЧ2 = ${result.work_numbers[1]}
РЧ3 = ${result.work_numbers[2]}
РЧ4 = ${result.work_numbers[3]}
`;
}

// ============================================
// КОМАНДЫ БОТА
// ============================================

bot.onText(/\/start(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const birthdate = match[1]; // дата из параметра
  
  if (birthdate) {
    // Если передана дата — считаем матрицу
    const result = calculateMatrix(birthdate);
    if (result.success) {
      bot.sendMessage(chatId, formatResult(result), { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат даты. Используйте ДД.ММ.ГГГГ');
    }
  } else {
    // Обычное приветствие с кнопками
    bot.sendMessage(chatId, '🌟 *Психоматрица Пифагора*\n\nВыберите действие:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 Открыть в браузере', url: 'https://psymatrix.bothost.ru' }],
          [{ text: '📱 Открыть Mini App', web_app: { url: 'https://psymatrix.bothost.ru' } }]
        ]
      }
    });
  }
});

// Обработка данных из Mini App (оставляем на случай, если BotHost починят)
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = msg.web_app_data.data;
  
  console.log('📲 Получены данные из Mini App:', data);
  
  try {
    const parsed = JSON.parse(data);
    const birthdate = parsed.birthdate || data;
    const result = calculateMatrix(birthdate);
    
    if (result.success) {
      bot.sendMessage(chatId, JSON.stringify(result), {
        reply_to_message_id: msg.message_id
      });
      bot.sendMessage(chatId, formatResult(result), { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, JSON.stringify({ error: result.error }), {
        reply_to_message_id: msg.message_id
      });
    }
  } catch (e) {
    bot.sendMessage(chatId, JSON.stringify({ error: 'Ошибка обработки' }), {
      reply_to_message_id: msg.message_id
    });
  }
});

console.log('🤖 Бот запущен!');