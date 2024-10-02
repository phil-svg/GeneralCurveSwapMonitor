import { EventEmitter } from 'events';
import { telegramBotMain } from './utils/telegram/TelegramBot.js';
import { connectToWebsocket } from './utils/websocket/GeneralTxWebsocket.js';
import { startFeeDistributor } from './utils/feeDistributor/FeeDistributorMain.js';
import { startCrvUSDFlashloan } from './utils/crvUSD_Flashloan/Flashloan.js';
import { startFeeSplitter } from './utils/feeSplitter/FeeSplitterMain.js';
console.clear();
// const ENV = 'prod';
const ENV = 'test';
// export const url = 'http://localhost:443';
export const url = 'wss://api.curvemonitor.com';
export const FILTER_VALUE_DEXDEX = 1000000;
// export const FILTER_VALUE_DEXDEX = 0;
const eventEmitter = new EventEmitter();
async function main() {
    await telegramBotMain(ENV, eventEmitter);
    await connectToWebsocket(eventEmitter);
    await startFeeDistributor(eventEmitter);
    await startCrvUSDFlashloan(eventEmitter);
    await startFeeSplitter(eventEmitter);
}
await main();
//# sourceMappingURL=GeneralSwapMonitor.js.map