import { EventEmitter } from "events";
import { telegramBotMain } from "./utils/telegram/TelegramBot.js";
import { connectToWebsocket } from "./utils/websocket/GeneralTxWebsocket.js";

console.clear();

const ENV = "prod";
// const ENV = "test";

export const FILTER_VALUE = 1000000;

const eventEmitter = new EventEmitter();

async function main() {
  await telegramBotMain(ENV, eventEmitter);
  await connectToWebsocket(eventEmitter);
}

await main();
