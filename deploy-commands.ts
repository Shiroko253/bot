import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  // Use dynamic import for TypeScript compatibility
  const command = require(path.join(commandsPath, file));
  if (command && command.data && typeof command.data.toJSON === 'function') {
    commands.push(command.data.toJSON());
  }
}

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) {
  throw new Error('DISCORD_TOKEN is not defined in environment variables.');
}
if (!clientId) {
  throw new Error('CLIENT_ID is not defined in environment variables.');
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('開始部署斜線指令...');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('斜線指令部署完成!');
  } catch (error) {
    console.error(error);
  }
})();
