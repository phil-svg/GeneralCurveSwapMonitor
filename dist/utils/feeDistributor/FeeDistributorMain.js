import { buildFeeDistributorMessage } from '../telegram/TelegramBot.js';
import { getContractcrvUSD } from './Helper.js';
async function processHit(eventEmitter, txHash, sender, value) {
    const message = await buildFeeDistributorMessage(txHash, sender, value);
    if (message)
        eventEmitter.emit('newMessage', message);
}
async function processRawEvent(eventEmitter, event) {
    const feeCollectorAddress = '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00';
    const decimals = 18;
    const receiver = event.returnValues.receiver;
    if (receiver.toLowerCase() === feeCollectorAddress.toLowerCase()) {
        console.log('Event spotted for feeCollector:', event);
        const txHash = event.transactionHash;
        const sender = event.returnValues.sender;
        const factor = BigInt(10 ** decimals);
        const value = Number(event.returnValues.value / factor);
        // if (value < 25) {
        //   console.log('Value is too small to be a hit:', value);
        //   return;
        // }
        await processHit(eventEmitter, txHash, sender, value);
    }
}
export async function startFeeDistributor(eventEmitter) {
    const contractCrvUSD = await getContractcrvUSD();
    // LIVE
    const subscription = contractCrvUSD.events.Transfer({ fromBlock: 'latest' }).on('data', async (event) => {
        await processRawEvent(eventEmitter, event);
    });
    /*
    //  HISTORICAL
    const startBlock = 20323208;
    const endBlock = startBlock;
    // const endBlock = 20164999;
    const pastEvents = await getPastEvents(contractCrvUSD, 'Transfer', startBlock, endBlock);
    if (Array.isArray(pastEvents)) {
      console.log('found', pastEvents.length, 'events');
      for (const event of pastEvents) {
        await processRawEvent(eventEmitter, event);
      }
    }
    */
}
//# sourceMappingURL=FeeDistributorMain.js.map