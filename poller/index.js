const { ethers } = require('ethers');

// TODO: сделать список провайдеров для всех сетей
const providerURL = process.env.PROVIDER_URL || 'https://eth.public-rpc.com';
const provider = new ethers.JsonRpcProvider(providerURL);
const erc20ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  }
];

const {db} = require('../db/db.js');

// обычно такие циклы делаются через айди таймера, но т к получение инфы из блокчейна занимает несколько секунд, то есть возможность запустить этот бесконечный цикл несколько раз.
// TODO: вынести стейт в базу и опрашивать базу
const stateControl = {
  currentState: 'stopped',
  timerId: null
}

async function getBalance({contract, accountAddress}) {
  const balance = await contract.balanceOf(accountAddress);
  let decimals = false;
  let formattedBalance = false;
  if(contract.decimals){
    decimals = await contract.decimals();
    formattedBalance = ethers.formatUnits(balance, decimals);
  } else {
    formattedBalance = balance;
  }
  return formattedBalance;
};

async function writeToDB({tokenAddress, accountAddress, balance, tokenName}) {
  const prevRecodr = await db.model('Balances').findOne({
    where: {
      accountAddress, 
      tokenAddress
    }
  });
  if(prevRecodr){
    prevRecodr.balance = balance;
    await prevRecodr.save();
  } else {
    await db.model('Balances').create({
      accountAddress, 
      tokenAddress, 
      balance, 
      tokenName
    })
  }
  console.log('writeToDB: ', tokenAddress, accountAddress, balance);
}

function getContractInstance({tokenAddress, tokenABI}) {
  const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
  return contract;
}

async function processTokenAddress({tokenAddress, accountAddress}){
  let tokenName;
  try {
    const contract = getContractInstance({tokenAddress, tokenABI: erc20ABI});
    tokenName = await contract.symbol();
    const balance = await getBalance({contract, accountAddress });
    await writeToDB({tokenAddress, accountAddress, balance, tokenName});
    return {tokenAddress, accountAddress, balance, tokenName};
  } catch (error) {
    console.error(`Error with tokenAddress ${tokenAddress} and accountAddress ${accountAddress}: `, error);
    return {tokenAddress, accountAddress, balance: null, tokenName: tokenName || ''};
  }
}
// TODO: вынести в отдельный модуль
async function sendToTelegramm(resArray) {
  console.log('sendToTelegramm: ', resArray);
}

async function polling({tokenAddresses, accountAddress, timeInterval}) {

  stateControl.currentState = 'inProgress';
  const toProcess = [];
  for(const tokenAddress of tokenAddresses){
    toProcess.push(processTokenAddress({tokenAddress, accountAddress}));
  }
  try {
    const res = await Promise.all(toProcess);
    await sendToTelegramm(res);
  } catch (error) {
    console.error('Error with one of addresses: ', error);
  }
  stateControl.timerId = setTimeout(polling, timeInterval, {tokenAddresses, accountAddress, timeInterval})
}

const startPolling = function({tokenAddresses, accountAddress, timeInterval}){
  if(stateControl.currentState!=='stopped'){
    console.log('polling in progress');
    return 'polling in progress';
  }
  console.log('starting polling');
  polling({tokenAddresses, accountAddress, timeInterval});
  return 'polling started';
}

const stopPolling = function(){
  if(stateControl.currentState!=='inProgress'){
    console.log('polling has not started yet');
    return 'polling has not started yet';
  }
  console.log('stopping polling');
  stateControl.currentState='stopped'

  clearTimeout(stateControl.timerId);
  timerId = null;
  return 'polling stopped';
}
const getState = function(){
  return stateControl.currentState;
}
module.exports = {
  startPolling,
  stopPolling, 
  getState
}