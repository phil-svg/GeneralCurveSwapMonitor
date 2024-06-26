import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';
import { labels } from '../../Labels.js';
import { EnrichedTransactionDetail } from '../../Interfaces.js';
import { solverLabels } from '../whitelisting/Whitelist.js';
import { readFileAsync } from '../websocket/GeneralTxWebsocket.js';
dotenv.config({ path: '../.env' });

async function getLastSeenValues() {
  try {
    const data = JSON.parse(await readFileAsync('lastSeen.json', 'utf-8'));
    return {
      txHash: data.txHash,
      txTimestamp: new Date(data.txTimestamp),
    };
  } catch (error) {
    console.error('Error reading last seen data from file:', error);
    return null;
  }
}

function getTokenURL(tokenAddress: string): string {
  return 'https://etherscan.io/token/' + tokenAddress;
}

function getBlockUrlEtherscan(blockNumber: number): string {
  return 'https://etherscan.io/block/' + blockNumber;
}

function getBlockUrlPayload(blockNumber: number): string {
  return 'https://payload.de/data/' + blockNumber;
}

function getBlockLinkEtherscan(blockNumber: number): string {
  const url = getBlockUrlEtherscan(blockNumber);
  const link = hyperlink(url, blockNumber.toString());
  return link;
}

function gerBlockLinkPayload(blockNumber: number): string {
  const url = getBlockUrlPayload(blockNumber);
  const link = hyperlink(url, blockNumber.toString());
  return link;
}

function getPoolURL(poolAddress: string) {
  return 'https://etherscan.io/address/' + poolAddress;
}

function getTxHashURLfromEtherscan(txHash: string) {
  return 'https://etherscan.io/tx/' + txHash;
}

function getTxHashURLfromEigenPhi(txHash: string) {
  return 'https://eigenphi.io/mev/eigentx/' + txHash;
}

function getBuyerURL(buyerAddress: string) {
  return 'https://etherscan.io/address/' + buyerAddress;
}

function formatForPrint(someNumber: any) {
  if (typeof someNumber === 'string' && someNumber.includes(',')) return someNumber;
  if (someNumber > 100) {
    someNumber = Number(Number(someNumber).toFixed(0)).toLocaleString();
  } else {
    someNumber = Number(Number(someNumber).toFixed(2)).toLocaleString();
  }
  return someNumber;
}

function getShortenNumber(amountStr: any) {
  let amount = parseFloat(amountStr.replace(/,/g, ''));
  //amount = roundToNearest(amount);
  if (amount >= 1000000) {
    const millionAmount = amount / 1000000;
    if (Number.isInteger(millionAmount)) {
      return `${millionAmount.toFixed(0)}M`;
    } else {
      return `${millionAmount.toFixed(2)}M`;
    }
  } else if (amount >= 1000) {
    const thousandAmount = amount / 1000;
    if (Number.isInteger(thousandAmount)) {
      return `${thousandAmount.toFixed(0)}k`;
    } else {
      return `${thousandAmount.toFixed(1)}k`;
    }
  } else {
    return `${amount.toFixed(2)}`;
  }
}

function getDollarAddOn(amountStr: any) {
  let amount = parseFloat(amountStr.replace(/,/g, ''));
  //amount = roundToNearest(amount);
  if (amount >= 1000000) {
    const millionAmount = amount / 1000000;
    if (Number.isInteger(millionAmount)) {
      return ` ($${millionAmount.toFixed(0)}M)`;
    } else {
      return ` ($${millionAmount.toFixed(2)}M)`;
    }
  } else if (amount >= 1000) {
    const thousandAmount = amount / 1000;
    if (Number.isInteger(thousandAmount)) {
      return ` ($${thousandAmount.toFixed(0)}k)`;
    } else {
      return ` ($${thousandAmount.toFixed(1)}k)`;
    }
  } else {
    return ` ($${amount.toFixed(2)})`;
  }
}

function formatExecutionPrice(price: number): string {
  if (price > 100) {
    // For numbers greater than 100, round to 2 decimal places
    return price.toFixed(2);
  } else if (price < 1) {
    const priceStr = price.toString();
    // Check if price is less than 1 and starts with leading 9's after the decimal point
    const leading9sMatch = priceStr.match(/0\.9*/);
    if (leading9sMatch) {
      const leading9s = leading9sMatch[0];
      // Calculate the number of characters to include: all leading 9's plus two more digits
      const endIndex = leading9s.length + 3;
      // Extract the substring and parse it to ensure correct rounding
      return parseFloat(priceStr.substring(0, endIndex)).toString();
    } else {
      // If there are no leading 9's, round to 4 decimal places
      return price.toFixed(4);
    }
  } else {
    // For numbers between 1 and 100, round to 4 decimal places
    return price.toFixed(4);
  }
}

function findUnderstandableExecutionPriceAndDenomination(
  priceA: number,
  priceB: number,
  coinLeavingWalletName: string,
  coinEnteringWalletName: string
): [string, string] {
  let price = 0;
  let denomination = '';

  if (priceA > 2) {
    price = priceA;
    denomination = `${coinEnteringWalletName}/${coinLeavingWalletName}`;
  } else if (priceB > 2) {
    price = priceB;
    denomination = `${coinLeavingWalletName}/${coinEnteringWalletName}`;
  } else {
    price = Math.min(priceA, priceB);
    // Decide the denomination based on which price (A or B) is smaller
    denomination =
      price === priceA
        ? `${coinLeavingWalletName}/${coinEnteringWalletName}`
        : `${coinEnteringWalletName}/${coinLeavingWalletName}`;
  }

  const formattedPrice = formatExecutionPrice(price);
  return [formattedPrice, denomination.toLowerCase()]; // Return both values as an array
}

type SolverLookup = { [address: string]: string };
const solverLookup: SolverLookup = solverLabels.reduce((acc: SolverLookup, solver) => {
  acc[solver.Address.toLowerCase()] = solver.Label;
  return acc;
}, {});

function hyperlink(link: string, name: string): string {
  return "<a href='" + link + "/'> " + name + '</a>';
}

let sentMessages: Record<string, boolean> = {};
export function send(bot: any, message: string, groupID: number) {
  const key = `${groupID}:${message}`;

  if (sentMessages[key]) {
    // console.log("This message has already been sent to this group in the past 30 seconds.");
    return;
  }

  bot.sendMessage(groupID, message, { parse_mode: 'HTML', disable_web_page_preview: 'true' });

  if (!message.startsWith('last seen')) {
    // Track the message as sent
    sentMessages[key] = true;

    // Delete the message from tracking after 30 seconds
    setTimeout(() => {
      delete sentMessages[key];
    }, 30000); // 30000 ms = 30 seconds
  }
}

function shortenAddress(address: string): string {
  return address.slice(0, 7) + '..' + address.slice(-2);
}

function getAddressName(address: string): string {
  // Find label for address
  const labelObject = labels.find(
    (label: { Address: string }) => label.Address.toLowerCase() === address.toLowerCase()
  );

  // If label found, return it. Otherwise, return shortened address
  return labelObject ? labelObject.Label : shortenAddress(address);
}

export async function buildGeneralTransactionMessage(enrichedTransaction: EnrichedTransactionDetail, value: number) {
  const POOL_URL_ETHERSCAN = getPoolURL(enrichedTransaction.poolAddress);
  const POOL = hyperlink(POOL_URL_ETHERSCAN, enrichedTransaction.poolName);
  const DOLLAR_ADDON = getDollarAddOn(value.toString());
  const solverURL = getBuyerURL(enrichedTransaction.from);
  let shortenSolver = getAddressName(enrichedTransaction.from);
  const LABEL_URL_ETHERSCAN = getPoolURL(enrichedTransaction.called_contract_by_user);

  const txHashUrl = getTxHashURLfromEtherscan(enrichedTransaction.tx_hash);

  let labelName = enrichedTransaction.calledContractLabel;
  if (labelName.startsWith('0x') && labelName.length === 42) {
    labelName = shortenAddress(labelName);
  }

  let transactedCoinInfo = '';
  let txType = '';
  const blockLinkEtherscan = getBlockLinkEtherscan(enrichedTransaction.block_number);
  const blockLinkPayload = gerBlockLinkPayload(enrichedTransaction.block_number);
  let priceAndBlocknumberTag = `Block:${blockLinkPayload} | Index: ${enrichedTransaction.tx_position}`;

  if (enrichedTransaction.transaction_type === 'swap') {
    txType = '🚀 Swap';
    let amountLeavingWallet = enrichedTransaction.coins_leaving_wallet[0].amount;
    let coinLeavingWalletUrl = getTokenURL(enrichedTransaction.coins_leaving_wallet[0].address);
    let coinLeavingWalletName = enrichedTransaction.coins_leaving_wallet[0].name;
    let amountEnteringWallet = enrichedTransaction.coins_entering_wallet[0].amount;
    let coinEnteringWalletUrl = getTokenURL(enrichedTransaction.coins_entering_wallet[0].address);
    let coinEnteringWalletName = enrichedTransaction.coins_entering_wallet[0].name;
    let priceA = amountLeavingWallet / amountEnteringWallet;
    let priceB = amountEnteringWallet / amountLeavingWallet;
    let [executionPrice, denominationTag] = findUnderstandableExecutionPriceAndDenomination(
      priceA,
      priceB,
      coinLeavingWalletName,
      coinEnteringWalletName
    );
    priceAndBlocknumberTag = `Execution Price: ${executionPrice} (${denominationTag})\nBlock:${blockLinkPayload} | Index: ${enrichedTransaction.tx_position}`;
    transactedCoinInfo = `${formatForPrint(amountLeavingWallet)}${hyperlink(
      coinLeavingWalletUrl,
      coinLeavingWalletName
    )} ➛ ${formatForPrint(amountEnteringWallet)}${hyperlink(coinEnteringWalletUrl, coinEnteringWalletName)}`;
  } else if (enrichedTransaction.transaction_type === 'remove') {
    txType = 'Remove';
    let coinsDetail = [];
    if (enrichedTransaction.coins_leaving_wallet.length > 0) {
      coinsDetail = enrichedTransaction.coins_leaving_wallet.map(
        (coin) => `${formatForPrint(coin.amount)}${hyperlink(getTokenURL(coin.address), coin.name)}`
      );
    } else {
      coinsDetail = enrichedTransaction.coins_entering_wallet.map(
        (coin) => `${formatForPrint(coin.amount)}${hyperlink(getTokenURL(coin.address), coin.name)}`
      );
    }
    transactedCoinInfo = `${coinsDetail.join(' | ')}`;
  } else if (enrichedTransaction.transaction_type === 'deposit') {
    txType = '🚀 Deposit';
    let coinsDetail = [];
    if (enrichedTransaction.coins_entering_wallet.length > 0) {
      coinsDetail = enrichedTransaction.coins_entering_wallet.map(
        (coin) => `${formatForPrint(coin.amount)}${hyperlink(getTokenURL(coin.address), coin.name)}`
      );
    } else {
      coinsDetail = enrichedTransaction.coins_leaving_wallet.map(
        (coin) => `${formatForPrint(coin.amount)}${hyperlink(getTokenURL(coin.address), coin.name)}`
      );
    }
    transactedCoinInfo = `${coinsDetail.join(' | ')}`;
  } else {
    return null;
  }

  let actorType = 'User';
  let actorURL = getBuyerURL(enrichedTransaction.trader);
  let shortenActor = getAddressName(enrichedTransaction.trader);
  let emoji = '🦙🦙🦙';

  // check if the from address is a solver
  let solverLabel = solverLookup[enrichedTransaction.from.toLowerCase()];
  if (solverLabel) {
    actorType = 'Solver';
    actorURL = getBuyerURL(enrichedTransaction.from);
    shortenActor = solverLabel;
    emoji = '🐮🐮🐮';
  }

  let firstLine = `${txType} ${transactedCoinInfo}${DOLLAR_ADDON}`;
  if (enrichedTransaction.transaction_type === 'remove') {
    firstLine = `${txType} ${transactedCoinInfo}${DOLLAR_ADDON}`;
  }
  return `
${firstLine}
${priceAndBlocknumberTag}
${actorType}:${hyperlink(actorURL, shortenActor)} called Contract:${hyperlink(LABEL_URL_ETHERSCAN, labelName)}
Links:${POOL} |${hyperlink(txHashUrl, 'etherscan.io')} ${emoji}
  `;
}

function determineSenderTagForFeeDistributor(sender: string) {
  const potentialFroms = {
    'Stable Deposit Burner': '0x1D56495c76d99435d10ecd5b0C3bd6a8EE7cC3bb',
    'Swap Router': '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',
    'Pool Owner': '0xeCb456EA5365865EbAb8a2661B0c503410e9B347',
    'CoW Settlement 🐮': '0x9008d19f58aabd9ed0d60971565aa8510560ab41',
  };
  const senderLower = sender.toLowerCase();
  for (const [key, value] of Object.entries(potentialFroms)) {
    if (value.toLowerCase() === senderLower) {
      return key;
    }
  }
  return shortenAddress(sender);
}

export async function buildFeeDistributorMessage(txHash: string, sender: string, value: number) {
  const senderUrl = getBuyerURL(sender);
  console.log('senderUrl:', senderUrl);
  const senderTag = determineSenderTagForFeeDistributor(sender);
  console.log('senderTag:', senderTag);
  const txHashUrl = getTxHashURLfromEtherscan(txHash);
  console.log('txHashUrl:', txHashUrl);
  const feeCollectorAddress = '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00';
  const feeCollectorUrl = getBuyerURL(feeCollectorAddress);
  console.log('feeCollectorUrl:', feeCollectorUrl);

  return `
💰${hyperlink(feeCollectorUrl, 'Fee Collector')} received ${formatForPrint(value)} crvUSD from${hyperlink(
    senderUrl,
    senderTag
  )}
Links:${hyperlink(txHashUrl, 'txHash')} 🦙🦙🦙
  `;
}

function getTimeMessage(timestamp: Date): string {
  if (!timestamp) return 'never seen'; // If no transaction was seen

  const differenceInSeconds = (new Date().getTime() - timestamp.getTime()) / 1000;

  if (differenceInSeconds < 60) {
    const seconds = Math.floor(differenceInSeconds);
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
  }
  if (differenceInSeconds < 3600) {
    const minutes = Math.floor(differenceInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  const hours = Math.floor(differenceInSeconds / 3600);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
}

function getLastSeenMessage(txHash: string, timestamp: Date) {
  const timeMessage = getTimeMessage(timestamp);
  const message = `I've last seen a${hyperlink(getTxHashURLfromEtherscan(txHash), 'tx')} ${timeMessage} ser`;
  return message;
}

let intervalId: NodeJS.Timeout | null = null;

async function getLastSeenMessageContent(): Promise<string> {
  const lastSeenValues = await getLastSeenValues();

  if (!lastSeenValues || !lastSeenValues.txHash) {
    return 'dunno';
  }

  return getLastSeenMessage(lastSeenValues.txHash, lastSeenValues.txTimestamp);
}

// prints sharpy updates at h:00, h:15, h:30, h:45
async function botMonitoringIntervalPrint(bot: any) {
  // If the interval is already set, return immediately.
  if (intervalId) return;

  const groupID = -1001929399603;

  const sendBotMessage = async () => {
    const message = await getLastSeenMessageContent();
    bot.sendMessage(groupID, message, { parse_mode: 'HTML', disable_web_page_preview: 'true' });
  };

  const currentMinute = new Date().getMinutes();
  let minutesUntilNextQuarter = 15 - (currentMinute % 15);
  let timeoutDuration = minutesUntilNextQuarter * 60 * 1000; // Duration until next quarter hour in milliseconds.

  setTimeout(() => {
    sendBotMessage();
    intervalId = setInterval(sendBotMessage, 15 * 60 * 1000); // Set 15 minutes interval after the first message.
  }, timeoutDuration);
}

export async function processLastSeen(eventEmitter: EventEmitter) {
  const message = await getLastSeenMessageContent();
  eventEmitter.emit('newMessage', message);
}

export async function telegramBotMain(env: string, eventEmitter: EventEmitter) {
  eventEmitter.on('newMessage', (message: string) => {
    if (groupID) {
      send(bot, message, parseInt(groupID));
    }
  });

  let telegramGroupToken: string | undefined;
  let groupID: string | undefined;

  if (env == 'prod') {
    telegramGroupToken = process.env.TELEGRAM_GENERAL_SWAP_MONITOR_PROD_KEY!;
    groupID = process.env.TELEGRAM_PROD_GROUP_ID!;
  }
  if (env == 'test') {
    telegramGroupToken = process.env.TELEGRAM_GENERAL_SWAP_MONITOR_TEST_KEY!;
    groupID = process.env.TELEGRAM_TEST_GROUP_ID!;
  }

  const bot = new TelegramBot(telegramGroupToken!, { polling: true });

  botMonitoringIntervalPrint(bot);

  bot.on('message', async (msg: any) => {
    if (msg && msg.text && msg.text.toLowerCase() === 'bot u with us') {
      await new Promise((resolve) => setTimeout(resolve, 500));
      bot.sendMessage(msg.chat.id, 'yes ser');
    }
    if (msg && msg.text && msg.text.toLowerCase() === 'print last seen') {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await processLastSeen(eventEmitter);
    }
  });
}
