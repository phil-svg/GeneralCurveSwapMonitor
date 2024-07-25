import { getContractcrvUSDFlashLender } from '../Helper.js';
import { buildCrvUSDFlashloanMessage } from '../telegram/TelegramBot.js';
async function processHit(eventEmitter, txHash) {
    const message = await buildCrvUSDFlashloanMessage(txHash);
    if (message)
        eventEmitter.emit('newMessage', message);
}
async function processRawEvent(eventEmitter, event) {
    console.log('Event spotted for feeCollector:', event);
    const txHash = event.transactionHash;
    await processHit(eventEmitter, txHash);
}
export async function startCrvUSDFlashloan(eventEmitter) {
    const contractcrvUSDFlashLender = await getContractcrvUSDFlashLender();
    // LIVE
    const subscription = contractcrvUSDFlashLender.events
        .allEvents({ fromBlock: 'latest' })
        .on('data', async (event) => {
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
//# sourceMappingURL=Flashloan.js.map