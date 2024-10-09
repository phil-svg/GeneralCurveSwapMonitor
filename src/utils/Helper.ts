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

export async function getContractFeeSplitter() {
  let WEB3_WS_PROVIDER = getWeb3WsProvider();
  const abi: any[] = [
    {
      anonymous: false,
      inputs: [],
      name: 'SetReceivers',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [],
      name: 'LivenessProtectionTriggered',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          name: 'receiver',
          type: 'address',
        },
        {
          indexed: false,
          name: 'weight',
          type: 'uint256',
        },
      ],
      name: 'FeeDispatched',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          name: 'previous_owner',
          type: 'address',
        },
        {
          indexed: true,
          name: 'new_owner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      inputs: [
        {
          name: 'new_owner',
          type: 'address',
        },
      ],
      name: 'transfer_ownership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounce_ownership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'update_controllers',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'n_controllers',
      outputs: [
        {
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          name: 'arg0',
          type: 'address',
        },
      ],
      name: 'allowed_controllers',
      outputs: [
        {
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          name: 'arg0',
          type: 'uint256',
        },
      ],
      name: 'controllers',
      outputs: [
        {
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'dispatch_fees',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          name: 'controllers',
          type: 'address[]',
        },
      ],
      name: 'dispatch_fees',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          components: [
            {
              name: 'addr',
              type: 'address',
            },
            {
              name: 'weight',
              type: 'uint256',
            },
          ],
          name: 'receivers',
          type: 'tuple[]',
        },
      ],
      name: 'set_receivers',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'excess_receiver',
      outputs: [
        {
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'n_receivers',
      outputs: [
        {
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'version',
      outputs: [
        {
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          name: 'arg0',
          type: 'uint256',
        },
      ],
      name: 'receivers',
      outputs: [
        {
          components: [
            {
              name: 'addr',
              type: 'address',
            },
            {
              name: 'weight',
              type: 'uint256',
            },
          ],
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          name: '_crvusd',
          type: 'address',
        },
        {
          name: '_factory',
          type: 'address',
        },
        {
          components: [
            {
              name: 'addr',
              type: 'address',
            },
            {
              name: 'weight',
              type: 'uint256',
            },
          ],
          name: 'receivers',
          type: 'tuple[]',
        },
        {
          name: 'owner',
          type: 'address',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
  ];
  const address = '0x2dFd89449faff8a532790667baB21cF733C064f2';
  const contract = new WEB3_WS_PROVIDER.eth.Contract(abi, address);
  return contract;
}
