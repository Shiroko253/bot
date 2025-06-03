require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// 載入事件處理（載入 build/events 裡的 .js）
const eventsPath = path.join(__dirname, 'build', 'events');
fs.readdirSync(eventsPath).forEach(file => {
  const event = require(`./build/events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
});

client.login(process.env.BOT_TOKEN);
