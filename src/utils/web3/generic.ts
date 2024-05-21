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
