import { buildFeeSplitterMessage } from '../telegram/TelegramBot.js';
import { getPastEvents, getWeb3WsProvider } from '../web3/generic.js';
import { getContractFeeSplitter } from '../Helper.js';
async function processHit(eventEmitter, txHash) {
    const message = await buildFeeSplitterMessage(txHash);
    if (message)
        eventEmitter.emit('newMessage', message);
}
async function processRawEvent(eventEmitter, event) {
    console.log('Event spotted for feeCollector:', event);
    const txHash = event.transactionHash;
    const sender = event.returnValues.sender;
    await processHit(eventEmitter, txHash);
}
export async function startFeeSplitter(eventEmitter) {
    const contractFeeSplitter = await getContractFeeSplitter();
    //  HISTORICAL
    let WEB3_WS_PROVIDER = getWeb3WsProvider();
    const currentBlock = Number(await WEB3_WS_PROVIDER.eth.getBlockNumber());
    const blocksPerMinute = 5;
    const startBlock = currentBlock - blocksPerMinute * 90; // past 1.5h
    const pastEvents = await getPastEvents(contractFeeSplitter, 'Transfer', startBlock, currentBlock);
    if (Array.isArray(pastEvents)) {
        console.log('found', pastEvents.length, 'events');
        for (const event of pastEvents) {
            await processRawEvent(eventEmitter, event);
        }
    }
    // LIVE
    const subscription = contractFeeSplitter.events
        .LivenessProtectionTriggered({ fromBlock: 'latest' })
        .on('data', async (event) => {
        await processRawEvent(eventEmitter, event);
    });
}
//# sourceMappingURL=FeeSplitterMain.js.map