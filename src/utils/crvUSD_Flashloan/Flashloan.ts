import { getContractcrvUSDFlashLender } from '../Helper.js';
import { buildCrvUSDFlashloanMessage } from '../telegram/TelegramBot.js';
import { getPastEvents } from '../web3/generic.js';

async function processHit(eventEmitter: any, event: any) {
  const message = await buildCrvUSDFlashloanMessage(event);
  if (message) eventEmitter.emit('newMessage', message);
}

async function processRawEvent(eventEmitter: any, event: any) {
  console.log('Event spotted:', event);
  const txHash = event.transactionHash;
  await processHit(eventEmitter, event);
}

export async function startCrvUSDFlashloan(eventEmitter: any) {
  const contractcrvUSDFlashLender = await getContractcrvUSDFlashLender();

  // LIVE
  const subscription = contractcrvUSDFlashLender.events
    .allEvents({ fromBlock: 'latest' })
    .on('data', async (event: any) => {
      await processRawEvent(eventEmitter, event);
    });

  /*
  //  HISTORICAL
  const startBlock = 21535801;
  const endBlock = startBlock;
  // const endBlock = 20164999;
  const pastEvents = await getPastEvents(contractcrvUSDFlashLender, 'FlashLoan', startBlock, endBlock);
  if (Array.isArray(pastEvents)) {
    console.log('found', pastEvents.length, 'events');
    for (const event of pastEvents) {
      await processRawEvent(eventEmitter, event);
    }
  }
  */
}
