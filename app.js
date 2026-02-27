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
// КОМАНДЫ БОТА
// ============================================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🌟 *Психоматрица Пифагора*\n\nВыберите действие:', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Открыть в браузере', url: 'https://psymatrix.bothost.ru' }],
        [{ text: '📱 Открыть Mini App', web_app: { url: 'https://psymatrix.bothost.ru' } }]
      ]
    }
  });
});

// Обработка данных из Mini App
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = msg.web_app_data.data;
  
  console.log('📲 Получены данные из Mini App:', data);
  
  bot.sendMessage(chatId, `✅ Получено: ${data}`, {
    reply_to_message_id: msg.message_id
  });
});

console.log('🤖 Бот запущен!');