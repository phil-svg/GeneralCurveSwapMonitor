import {
  buildFeeDistributorMessage,
  buildFeeDistributorMessageRewardsHandler,
  buildFeeDistributorSummaryMessage,
} from '../telegram/TelegramBot.js';
import { getCurrentBlocknumber, getPastEvents } from '../web3/generic.js';
import { getContractcrvUSD } from '../Helper.js';
// import {
//   flushSummaryStore,
//   loadSummaryStore,
//   markSummaryProcessed,
//   saveSummaryEvent,
//   shouldPostSummary,
// } from './SummaryStore.js';
import { loadSummaryStore, saveSummaryEvent, shouldPostSummary, commitSummaryPosted } from './SummaryStore.js';

const feeCollectorAddress = '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00';
const rewardsHandlerAddress = '0xE8d1E2531761406Af1615A6764B0d5fF52736F56';
const decimals = 18;

async function processHitRewardsHandler(eventEmitter: any, txHash: string, sender: string, value: number) {
  const message = await buildFeeDistributorMessageRewardsHandler(txHash, sender, value);
  if (message) eventEmitter.emit('newMessage', message);
}

async function processRawEvent(eventEmitter: any, event: any) {
  const receiver = event.returnValues.receiver?.toLowerCase();
  const sender = event.returnValues.sender?.toLowerCase();
  const txHash = event.transactionHash;
  const value = Number(event.returnValues.value) / 10 ** decimals;
  const blockNumber = Number(event.blockNumber);

  if (!txHash || !receiver || !sender || isNaN(value)) return;

  if (receiver === feeCollectorAddress.toLowerCase()) {
    await saveSummaryEvent({ blockNumber, txHash, sender, value });
    // const msg = await buildFeeDistributorMessage(txHash, sender, value);
    // if (msg) eventEmitter.emit('newMessage', msg);
  }

  /*
  if (receiver === rewardsHandlerAddress.toLowerCase()) {
    // console.log('Event spotted for feeCollector:', event);
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
  */
}

export async function startFeeDistributor(eventEmitter: any) {
  const contractCrvUSD = await getContractcrvUSD();

  // SUMMARY
  // setInterval(async () => {
  //   const { shouldPost, timestamp } = await shouldPostSummary();
  //   // if (!shouldPost) return;

  //   console.log('DEBUGGING STARTlololololololool');

  //   //  HISTORICAL
  //   const nowBlock = await getCurrentBlocknumber();
  //   if (!nowBlock) return;
  //   const startBlock = Number(nowBlock) - 5 * 60 * 24 * 7; // last 7 days
  //   const endBlock = Number(nowBlock);
  //   console.time();
  //   const pastEvents = await getPastEventsChunked(contractCrvUSD, 'Transfer', startBlock, endBlock);
  //   console.log('pastEvents', pastEvents.length);
  //   console.timeEnd();
  //   if (Array.isArray(pastEvents)) {
  //     for (const event of pastEvents) {
  //       await processRawEvent(eventEmitter, event);
  //     }
  //   }

  //   const store = await loadSummaryStore();
  //   const relevant = store.events;

  //   if (relevant.length === 0) return;

  //   const total = relevant.reduce((acc, ev) => acc + ev.value, 0);
  //   const message = buildFeeDistributorSummaryMessage(total);

  //   eventEmitter.emit('newMessage', message);

  //   await flushSummaryStore();
  //   await markSummaryProcessed(timestamp.getTime());
  // }, 60_000); // every minute

  let tickRunning = false;
  setInterval(async () => {
    // NEW NEW NEW NEW
    if (tickRunning) return; // ~8s fetch must not pile up on the 60s timer
    tickRunning = true;
    try {
      // 1) ACCUMULATE — always record the week's transfers (store dedupes)
      const nowBlock = await getCurrentBlocknumber();
      if (!nowBlock) return;
      const endBlock = Number(nowBlock);
      const startBlock = endBlock - 5 * 60 * 24 * 7; // last 7 days

      const pastEvents = await getPastEventsChunked(contractCrvUSD, 'Transfer', startBlock, endBlock);
      for (const event of pastEvents) {
        await processRawEvent(eventEmitter, event);
      }

      // 2) POST — only once per scheduled week
      const { shouldPost, timestamp } = await shouldPostSummary();
      if (!shouldPost) return;

      const store = await loadSummaryStore();
      const total = store.events.reduce((acc, ev) => acc + ev.value, 0);
      const message = buildFeeDistributorSummaryMessage(total);

      // 3) emit === false means NO listener received it → not sent → don't commit, retry next tick
      const delivered = eventEmitter.emit('newMessage', message);
      if (!delivered) {
        console.error('weekly summary had no listener — not marking processed, will retry');
        return;
      }

      // 4) confirmed sent → clear events + mark processed in ONE atomic write
      await commitSummaryPosted(timestamp.getTime());
      console.log(`weekly summary sent for ${timestamp.toISOString()}, total ${total}`);
    } catch (err) {
      console.error('fee distributor tick failed, will retry next minute:', err);
    } finally {
      tickRunning = false;
    }
  }, 60_000);
}

function isRateLimitError(err: any): boolean {
  if (!err) return false;
  const status = err.status ?? err.statusCode ?? err.response?.status;
  if (status === 429) return true;
  const code = err.code ?? err.error?.code ?? err.response?.data?.error?.code;
  if (code === -32005 || code === -32016 || code === -32097) return true;
  const msg = (err.message ?? err.error?.message ?? err.response?.data?.error?.message ?? '').toString().toLowerCase();
  return ['rate limit', 'too many requests', '429', 'throttle', 'capacity', 'exceeded', 'limit exceeded'].some((s) =>
    msg.includes(s)
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drop-in for getPastEvents that bypasses the provider's 1k-block getLogs cap.
 * Splits [fromBlock, toBlock] into <=1000-block windows and fetches them with
 * bounded concurrency + 429 backoff. Returns all events in block order.
 * Throws if any window can't be fetched (no silent partial results).
 */
export async function getPastEventsChunked(
  contract: any,
  eventName: string,
  fromBlock: number,
  toBlock: number,
  concurrency = 16,
  chunkSize = 1000,
  maxRetries = 5
): Promise<any[]> {
  // build inclusive [from, to] windows; getLogs is inclusive both ends, so span = size - 1
  const chunks: Array<[number, number]> = [];
  const span = chunkSize - 1;
  for (let from = fromBlock; from <= toBlock; from += chunkSize) {
    chunks.push([from, Math.min(from + span, toBlock)]);
  }

  const results: any[][] = new Array(chunks.length);
  let next = 0;
  let failed: { chunk: [number, number]; err: any } | null = null;

  async function fetchOne(from: number, to: number): Promise<any[]> {
    let attempt = 0;
    for (;;) {
      try {
        const res = await getPastEvents(contract, eventName, from, to);
        return Array.isArray(res) ? res : [];
      } catch (err) {
        if (isRateLimitError(err) && attempt < maxRetries) {
          await sleep(Math.min(8000, 250 * 2 ** attempt)); // 250,500,1000,2000,4000ms
          attempt++;
          continue;
        }
        throw err;
      }
    }
  }

  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= chunks.length || failed) return;
      const [from, to] = chunks[i];
      try {
        results[i] = await fetchOne(from, to);
      } catch (err) {
        failed = { chunk: chunks[i], err };
        return;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, chunks.length) }, worker));

  if (failed) {
    throw new Error(`getPastEventsChunked: window failed after retries: `);
  }

  // results are filled in chunk order (ascending blocks), so flatten preserves order
  return results.flat();
}
