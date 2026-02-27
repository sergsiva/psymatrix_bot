const http = require('http');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

// ============================================
// СЕРВЕР ДЛЯ РАЗДАЧИ СТАТИКИ
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
});

// ============================================
// ФУНКЦИЯ РАСЧЁТА МАТРИЦЫ
// ============================================
function calculateMatrix(birthdate) {
  try {
    const [day, month, year] = birthdate.split('.').map(Number);
    
    const digits = [];
    [day, month, year].forEach(num => {
      num.toString().split('').forEach(d => digits.push(parseInt(d)));
    });
    
    const work1 = digits.reduce((a, b) => a + b, 0);
    const work2 = work1.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    const firstDigitDay = parseInt(day.toString()[0]);
    const work3 = work1 - 2 * firstDigitDay;
    const work4 = work3.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    
    const allDigits = [...digits];
    [work1, work2, work3, work4].forEach(num => {
      num.toString().split('').forEach(d => allDigits.push(parseInt(d)));
    });
    
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
// КОМАНДЫ БОТА
// ============================================

// Приветствие с кнопкой Mini App
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🌟 *Психоматрица Пифагора*\n\nОткройте приложение:', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '📱 Открыть Mini App', web_app: { url: 'https://psymatrix.bothost.ru' } }
      ]]
    }
  });
});

// ============================================
// УНИВЕРСАЛЬНЫЙ ЛОГГЕР (все сообщения)
// ============================================
bot.on('message', (msg) => {
    console.log('🔵 ВСЕ сообщения:', JSON.stringify(msg, null, 2));
  });
  
  // ============================================
  // ОБРАБОТКА ДАННЫХ ИЗ MINI APP
  // ============================================
  bot.on('message', (msg) => {
    if (msg.web_app_data) {
      const data = msg.web_app_data.data;
      console.log('📲 Данные из Mini App:', data);
      
      try {
        const parsed = JSON.parse(data);
        const birthdate = parsed.birthdate;
        const result = calculateMatrix(birthdate);
        
        if (result.success) {
          bot.sendMessage(msg.chat.id, JSON.stringify(result), {
            reply_to_message_id: msg.message_id
          });
        } else {
          bot.sendMessage(msg.chat.id, JSON.stringify({ error: result.error }), {
            reply_to_message_id: msg.message_id
          });
        }
      } catch (e) {
        console.error('❌ Ошибка обработки:', e);
      }
    }
  });

console.log('🤖 Бот запущен!');
console.log('📱 Mini App доступен по адресу: https://psymatrix.bothost.ru');