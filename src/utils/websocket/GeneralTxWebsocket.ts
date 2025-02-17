import { EnrichedTransactionDetail } from '../../Interfaces.js';
import { buildGeneralTransactionMessage } from '../telegram/TelegramBot.js';
import { io } from 'socket.io-client';
import { priceTransaction } from '../txValue/PriceTransaction.js';
import { FILTER_VALUE_DEXDEX, url } from '../../GeneralSwapMonitor.js';
import { solverLabels } from '../whitelisting/Whitelist.js';

const processedTxIds = new Set();

import fs from 'fs';
import { promisify } from 'util';

// Promisify the necessary fs methods for easier async/await usage
export const writeFileAsync = promisify(fs.writeFile);
export const readFileAsync = promisify(fs.readFile);

async function saveLastSeenToFile(hash: string, timestamp: Date) {
  const data = {
    txHash: hash,
    txTimestamp: timestamp.toISOString(),
  };
  await writeFileAsync('lastSeen.json', JSON.stringify(data, null, 2));
}

// Clear the cache every 5 minutes
setInterval(() => {
  processedTxIds.clear();
}, 5 * 60 * 1000);

export async function connectToWebsocket(eventEmitter: any) {
  const mainSocket = io(`${url}/main`);

  // A map to store transactions that are being delayed
  const pendingTransactions = new Map();

  mainSocket.on('connect', () => {
    console.log('connected');
    // Connect to both General Tx Livestream and Sandwich Livestream
    mainSocket.emit('connectToGeneralTxLivestream');
    mainSocket.emit('connectToGeneralSandwichLivestream');

    mainSocket.on('NewSandwich', async (enrichedSandwich: any) => {
      console.log('Received result: ', enrichedSandwich);
      // Remove related transactions from the pendingTransactions map
      // by looking for transactions from the frontrun, center, and backrun parts of the sandwich
      ['frontrun', 'backrun'].forEach((type) => {
        const hash = enrichedSandwich[type].tx_hash;
        if (pendingTransactions.has(hash)) {
          clearTimeout(pendingTransactions.get(hash));
          pendingTransactions.delete(hash);
        }
      });
      enrichedSandwich.center.forEach((transaction: { tx_hash: any }) => {
        if (pendingTransactions.has(transaction.tx_hash)) {
          clearTimeout(pendingTransactions.get(transaction.tx_hash));
          pendingTransactions.delete(transaction.tx_hash);
        }
      });
    });

    mainSocket.on('NewGeneralTx', async (enrichedTransaction: EnrichedTransactionDetail) => {
      // Saving last-seen values, in case bot goes quite.
      let lastSeenTxHash = enrichedTransaction.tx_hash;
      let lastSeenTxTimestamp = new Date();
      await saveLastSeenToFile(lastSeenTxHash, lastSeenTxTimestamp);

      console.log('enrichedTransaction', enrichedTransaction);

      // Check if the transaction has already been processed
      if (processedTxIds.has(enrichedTransaction.tx_id)) return;

      // Check if transaction is in pending
      if (pendingTransactions.has(enrichedTransaction.tx_hash)) return;

      // Start a timer that waits for 5 seconds before processing the transaction
      const timerId = setTimeout(async () => {
        // Process the transaction after 5 seconds, unless it's part of a sandwich transaction

        // If no coins were moved in the transaction, there's nothing to process
        if (
          enrichedTransaction.coins_leaving_wallet.length === 0 &&
          enrichedTransaction.coins_entering_wallet.length === 0
        ) {
          console.log(`No Coins were moved in tx ${enrichedTransaction.tx_hash}`);
          return;
        }

        // Add transaction id to the set of processed transactions
        processedTxIds.add(enrichedTransaction.tx_id);

        // Calculate the value of the transaction and build a message about it
        const value = await priceTransaction(enrichedTransaction);

        const whitelistedAddresses = solverLabels.map((solver) => solver.Address.toLowerCase());

        const address_crv2pool = '0x4f493b7de8aac7d55f71853688b1f7c8f0243c85';

        if (value) {
          if (enrichedTransaction.poolAddress.toLowerCase() === address_crv2pool.toLowerCase()) {
            if (value > 250000) {
              const message = await buildGeneralTransactionMessage(enrichedTransaction, value);
              eventEmitter.emit('newMessage', message);
            }
            return;
          } else if (
            value < FILTER_VALUE_DEXDEX &&
            !whitelistedAddresses.includes(enrichedTransaction.poolAddress.toLowerCase())
          ) {
            return;
          }
          const message = await buildGeneralTransactionMessage(enrichedTransaction, value);
          eventEmitter.emit('newMessage', message);
        } else {
          console.log(`Couldn't price transaction ${enrichedTransaction.tx_hash}`);
        }

        // After processing the transaction, remove it from the pendingTransactions map
        pendingTransactions.delete(enrichedTransaction.tx_hash);
      }, 5000); // Wait for 5 seconds

      // Add the transaction to the pendingTransactions map along with its timer
      pendingTransactions.set(enrichedTransaction.tx_hash, timerId);
    });
  });
}
