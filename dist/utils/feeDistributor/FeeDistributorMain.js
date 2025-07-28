import { buildFeeDistributorMessage, buildFeeDistributorMessageRewardsHandler, buildFeeDistributorSummaryMessage, } from '../telegram/TelegramBot.js';
import { getPastEvents } from '../web3/generic.js';
import { getContractcrvUSD } from '../Helper.js';
import { flushSummaryStore, loadSummaryStore, markSummaryProcessed, saveSummaryEvent, shouldPostSummary, } from './SummaryStore.js';
const feeCollectorAddress = '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00';
const rewardsHandlerAddress = '0xE8d1E2531761406Af1615A6764B0d5fF52736F56';
const decimals = 18;
async function processHit(eventEmitter, txHash, sender, value) {
    const message = await buildFeeDistributorMessage(txHash, sender, value);
    if (message)
        eventEmitter.emit('newMessage', message);
}
async function processHitRewardsHandler(eventEmitter, txHash, sender, value) {
    const message = await buildFeeDistributorMessageRewardsHandler(txHash, sender, value);
    if (message)
        eventEmitter.emit('newMessage', message);
}
async function processRawEvent(eventEmitter, event) {
    var _a, _b;
    const receiver = (_a = event.returnValues.receiver) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const sender = (_b = event.returnValues.sender) === null || _b === void 0 ? void 0 : _b.toLowerCase();
    const txHash = event.transactionHash;
    const value = Number(event.returnValues.value) / 10 ** decimals;
    const blockNumber = Number(event.blockNumber);
    if (!txHash || !receiver || !sender || isNaN(value))
        return;
    if (receiver === feeCollectorAddress.toLowerCase()) {
        await saveSummaryEvent({ blockNumber, txHash, sender, value });
        // const msg = await buildFeeDistributorMessage(txHash, sender, value);
        // if (msg) eventEmitter.emit('newMessage', msg);
    }
    if (receiver === rewardsHandlerAddress.toLowerCase()) {
        console.log('Event spotted for feeCollector:', event);
        const txHash = event.transactionHash;
        const sender = event.returnValues.sender;
        const factor = BigInt(10 ** decimals);
        const value = Number(event.returnValues.value / factor);
        // if (value < 25) {
        //   console.log('Value is too small to be a hit:', value);
        //   return;
        // }
        await processHitRewardsHandler(eventEmitter, txHash, sender, value);
    }
}
export async function startFeeDistributor(eventEmitter) {
    const contractCrvUSD = await getContractcrvUSD();
    // LIVE
    contractCrvUSD.events.Transfer({ fromBlock: 'latest' }).on('data', async (event) => {
        await processRawEvent(eventEmitter, event);
    });
    //  HISTORICAL
    const startBlock = 22920865;
    // const endBlock = startBlock;
    const endBlock = 22920976;
    const pastEvents = await getPastEvents(contractCrvUSD, 'Transfer', startBlock, endBlock);
    if (Array.isArray(pastEvents)) {
        console.log('found', pastEvents.length, 'events');
        for (const event of pastEvents) {
            await processRawEvent(eventEmitter, event);
        }
    }
    // SUMMARY
    setInterval(async () => {
        const { shouldPost, timestamp } = await shouldPostSummary();
        if (!shouldPost)
            return;
        const store = await loadSummaryStore();
        const relevant = store.events;
        if (relevant.length === 0)
            return;
        const total = relevant.reduce((acc, ev) => acc + ev.value, 0);
        const message = buildFeeDistributorSummaryMessage(total);
        eventEmitter.emit('newMessage', message);
        await flushSummaryStore();
        await markSummaryProcessed(timestamp.getTime());
    }, 60000); // every minute
}
//# sourceMappingURL=FeeDistributorMain.js.map