import { getWeb3WsProvider } from './web3/generic.js';

export async function getContract3Crv() {
  let WEB3_WS_PROVIDER = getWeb3WsProvider();
  const abi: any[] = [
    {
      name: 'Transfer',
      inputs: [
        {
          name: 'sender',
          type: 'address',
          indexed: true,
        },
        {
          name: 'receiver',
          type: 'address',
          indexed: true,
        },
        {
          name: 'value',
          type: 'uint256',
          indexed: false,
        },
      ],
      anonymous: false,
      type: 'event',
    },
  ];
  const address = '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490';
  const contract = new WEB3_WS_PROVIDER.eth.Contract(abi, address);
  return contract;
}

export async function getContractcrvUSD() {
  let WEB3_WS_PROVIDER = getWeb3WsProvider();
  const abi: any[] = [
    {
      name: 'Transfer',
      inputs: [
        {
          name: 'sender',
          type: 'address',
          indexed: true,
        },
        {
          name: 'receiver',
          type: 'address',
          indexed: true,
        },
        {
          name: 'value',
          type: 'uint256',
          indexed: false,
        },
      ],
      anonymous: false,
      type: 'event',
    },
  ];
  const address = '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E';
  const contract = new WEB3_WS_PROVIDER.eth.Contract(abi, address);
  return contract;
}

export async function getContractcrvUSDFlashLender() {
  let WEB3_WS_PROVIDER = getWeb3WsProvider();
  const abi: any[] = [
    {
      name: 'FlashLoan',
      inputs: [
        { name: 'caller', type: 'address', indexed: true },
        { name: 'receiver', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
      ],
      anonymous: false,
      type: 'event',
    },
  ];
  const address = '0xA7a4bb50AF91f90b6fEb3388E7f8286aF45b299B';
  const contract = new WEB3_WS_PROVIDER.eth.Contract(abi, address);
  return contract;
}
