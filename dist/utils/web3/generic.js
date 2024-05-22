import Web3 from 'web3';
export function getWeb3WsProvider() {
    let web3WsProvider = null;
    const wsProvider = new Web3.providers.WebsocketProvider(process.env.WEB_WS_MAINNET);
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
export async function getPastEvents(CONTRACT, eventName, fromBlock, toBlock) {
    if (fromBlock === null || toBlock === null) {
        return null;
    }
    let retries = 0;
    const maxRetries = 12;
    let EVENT_ARRAY = [];
    while (retries < maxRetries) {
        try {
            const events = await CONTRACT.getPastEvents(eventName, { fromBlock, toBlock });
            for (const DATA of events) {
                EVENT_ARRAY.push(DATA);
            }
            break;
        }
        catch (error) {
            console.log('Error in getPastEvents:', error);
        }
        retries++;
    }
    return EVENT_ARRAY;
}
//# sourceMappingURL=generic.js.map