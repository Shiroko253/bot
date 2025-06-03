import { Client } from 'discord.js';

export const name = 'ready';
export const once = true;

export function execute(client: Client): void {
  console.log(`✅ Bot 已成功上線：${client.user?.tag}`);
}
