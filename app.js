const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const PORT = process.env.PORT || 3000;

// ============================================
// РАЗДАЧА СТАТИКИ (Mini App)
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
  let url = (req.url || '/').split('?')[0].replace(/^\/+/, '') || 'index.html';
  const publicDir = path.join(__dirname, 'public');
  const filePath = path.join(publicDir, path.normalize(url));
  const resolvedPath = path.resolve(filePath);
  const resolvedPublic = path.resolve(publicDir);

  if (!resolvedPath.startsWith(resolvedPublic + path.sep) && resolvedPath !== resolvedPublic) {
    res.writeHead(403);
    res.end('Доступ запрещён');
    return;
  }

  const extname = path.extname(resolvedPath);
  const contentType = mimeTypes[extname] || 'text/plain';

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Файл не найден');
      } else {
        res.writeHead(500);
        res.end(`Ошибка сервера: ${error.code}`);
      }
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
      matrix: matrix,
      interpretations: {
        1: ["Слабый характер", "Эгоист", "Мягкий характер", "Уравновешенный", "Сильный характер", "Тиран"][matrix[1]] || "Особое значение",
        2: ["Мало энергии", "Нормальная энергия", "Много энергии", "Очень много энергии"][matrix[2]] || "Особое значение",
        3: ["Нет интересов", "1-2 интереса", "Разносторонний", "Очень разносторонний"][matrix[3]] || "Особое значение",
        4: ["Слабое здоровье", "Нормальное", "Хорошее", "Отличное"][matrix[4]] || "Особое значение",
        5: ["Интуиция", "Логика+интуиция", "Логика", "Сильная логика"][matrix[5]] || "Особое значение",
        6: ["Не любит труд", "Нормально", "Трудолюбив", "Очень трудолюбив"][matrix[6]] || "Особое значение",
        7: ["Невезучий", "Нормальная удача", "Везучий", "Очень везучий"][matrix[7]] || "Особое значение",
        8: ["Безответственный", "Нормальный", "Ответственный", "Очень ответственный"][matrix[8]] || "Особое значение",
        9: ["Слабая память", "Нормальная", "Хорошая", "Отличная"][matrix[9]] || "Особое значение"
      }
    };
  } catch (e) {
    return { success: false, error: 'Неверный формат даты' };
  }
}

// ============================================
// КОМАНДЫ БОТА
// ============================================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeText = `
🌟 *Психоматрица Пифагора* 🌟

Я рассчитаю вашу матрицу судьбы по дате рождения!

*✨ Возможности:*
• 🧮 Рассчитать психоматрицу
• 📱 Открыть Mini App

*📅 Формат даты:* **ДД.ММ.ГГГГ**
*✨ Пример:* **15.08.1994**

Нажмите кнопку ниже, чтобы открыть приложение:
`;
  
  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '📱 Открыть приложение', web_app: { url: `https://${process.env.DOMAIN || 'localhost'}` } }
      ]]
    }
  });
});

// Обработка данных из Mini App
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = msg.web_app_data.data;
  
  console.log('📲 WebApp data:', data);
  
  try {
    const parsed = JSON.parse(data);
    const birthdate = parsed.birthdate || data;
    
    const result = calculateMatrix(birthdate);
    
    if (result.success) {
      // Отправляем результат обратно в Mini App
      bot.sendMessage(chatId, JSON.stringify(result), {
        reply_to_message_id: msg.message_id
      });
      
      // И дублируем в чат для удобства
      const m = result.matrix;
      const response = `
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
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
    } else {
      bot.sendMessage(chatId, JSON.stringify({ error: result.error }), {
        reply_to_message_id: msg.message_id
      });
    }
  } catch (e) {
    console.error('Ошибка обработки:', e);
  }
});

console.log('🤖 Бот запущен!');