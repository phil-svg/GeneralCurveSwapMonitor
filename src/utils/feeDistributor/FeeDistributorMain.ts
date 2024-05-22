import { buildFeeDistributorMessage } from '../telegram/TelegramBot.js';
import { getPastEvents } from '../web3/generic.js';
import { getContract3Crv } from './Helper.js';

async function processHit(eventEmitter: any, txHash: string, sender: string, value: number) {
  const message = await buildFeeDistributorMessage(txHash, sender, value);
  eventEmitter.emit('newMessage', message);
}

async function processRawEvent(eventEmitter: any, event: any) {
  const feeDistributorAddress = '0xA464e6DCda8AC41e03616F95f4BC98a13b8922Dc';
  const decimals3Crv = 18;
  const decimals = decimals3Crv;

  const receiver = event.returnValues.receiver;
  if (receiver.toLowerCase() === feeDistributorAddress.toLowerCase()) {
    console.log('Event spotted for feeDistribution:', event);
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

export async function startFeeDistributor(eventEmitter: any) {
  const contract3Crv = await getContract3Crv();

  // LIVE
  const subscription = contract3Crv.events.Transfer({ fromBlock: 'latest' }).on('data', async (event: any) => {
    await processRawEvent(eventEmitter, event);
  });

  /*
  //  HISTORICAL
  const startBlock = 19925234;
  const endBlock = startBlock;
  const pastEvents = await getPastEvents(contract3Crv, 'Transfer', startBlock, endBlock);
  if (Array.isArray(pastEvents)) {
    for (const event of pastEvents) {
      await processRawEvent(eventEmitter, event);
    }
  }
  */
}
