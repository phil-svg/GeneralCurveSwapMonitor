import { buildFeeDistributorMessage } from '../telegram/TelegramBot.js';
import { getContract3Crv } from './Helper.js';

async function processHit(eventEmitter: any, txHash: string, sender: string, value: number) {
  const message = await buildFeeDistributorMessage(txHash, sender, value);
  eventEmitter.emit('newMessage', message);
}

export async function startFeeDistributor(eventEmitter: any) {
  const feeDistributorAddress = '0xA464e6DCda8AC41e03616F95f4BC98a13b8922Dc';
  const contract3Crv = await getContract3Crv();
  const decimals3Crv = 18;
  const decimals = decimals3Crv;

  const subscription = contract3Crv.events.Transfer({ fromBlock: 'latest' }).on('data', async (event: any) => {
    const receiver = event.returnValues.receiver;
    if (receiver.toLowerCase() === feeDistributorAddress.toLowerCase()) {
      console.log('Event spotted for feeDistribution:', event);
      const txHash = event.transactionHash;
      const sender = event.returnValues.sender;
      const value = event.returnValues.value / 10 ** decimals;
      if (value < 25) {
        console.log('Value is too small to be a hit:', value);
        return;
      }
      await processHit(eventEmitter, txHash, sender, value);
    }
  });
}
