import Web3 from 'web3';

export function getWeb3WsProvider(): Web3 {
  let web3WsProvider: Web3 | null = null;
  const wsProvider = new Web3.providers.WebsocketProvider(process.env.WEB_WS_MAINNET!);

  // Attach 'end' event listener
  wsProvider.on('end', () => {
    web3WsProvider = null; // Clear instance so that it can be recreated.
    getWeb3WsProvider(); // Recursive call to recreate the provider.
  });

  wsProvider.on('error', () => {
    console.error('WS encountered an error');
  });

  web3WsProvider = new Web3(wsProvider);

  return web3WsProvider;
}

let web3HttpProvider: Web3 | null = null;

export function getWeb3HttpProvider(): Web3 {
  if (!web3HttpProvider) {
    web3HttpProvider = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_HTTP_MAINNET!));
  }
  return web3HttpProvider;
}

export async function getPastEvents(
  CONTRACT: any,
  eventName: string,
  fromBlock: number | null,
  toBlock: number | null
): Promise<Array<object> | { start: number; end: number } | null> {
  if (fromBlock === null || toBlock === null) {
    return null;
  }

  // always fetch over HTTP, even if the passed contract is bound to the WS provider
  const HTTP_CONTRACT: any = new (getWeb3HttpProvider().eth.Contract)(
    CONTRACT.options.jsonInterface,
    CONTRACT.options.address
  );

  let retries = 0;
  const maxRetries = 12;
  let EVENT_ARRAY: Array<object> = [];

  while (retries < maxRetries) {
    try {
      const events = await HTTP_CONTRACT.getPastEvents(eventName, { fromBlock, toBlock });
      for (const DATA of events) {
        EVENT_ARRAY.push(DATA);
      }
      break;
    } catch (error) {
      console.log('Error in getPastEvents:', error);
    }
    retries++;
  }

  return EVENT_ARRAY;
}

export async function getCurrentBlocknumber() {
  try {
    let web3HttpProvider = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_HTTP_MAINNET!));

    const blockNumber = await web3HttpProvider.eth.getBlockNumber();
    return blockNumber;
  } catch (err) {
    return null;
  }
}
