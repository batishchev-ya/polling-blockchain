let token;
if(localStorage){
  token = localStorage.getItem('accessToken');
}
if(!token){
  window.location = '/login'
}
function parseTokenAddresses(tokenAddresses) {
  return tokenAddresses.replace(',', ' ').replace(';', ' ').replace(/ {2,}/g, ' ').split(' ');
}

function getOrCreateNodeById(nodeId, nodeType) {
  let el;
  if(document.getElementById(nodeId)){
    el = document.getElementById(nodeId);
  } else {
    el = document.createElement(nodeType);
    el.setAttribute('id', nodeId);
  }
  return el;
}

function start(){
  const accountAddress = document.getElementById('accountAddress').value;
  const tokenAddressesString = document.getElementById('tokenAddresses').value;
  const tokenAddresses = parseTokenAddresses(tokenAddressesString);
  const telegramBotAPIKey = document.getElementById('telegramBotAPIKey').value;
  const telegramChannelID = document.getElementById('telegramChannelID').value;
  const updateTimeout = document.getElementById('updateTimeout').value;
  if(localStorage){
    localStorage.setItem('accountAddress', accountAddress);
    localStorage.setItem('tokenAddresses', tokenAddresses);
    localStorage.setItem('telegramBotAPIKey', telegramBotAPIKey);
    localStorage.setItem('telegramChannelID', telegramChannelID);
    localStorage.setItem('updateTimeout', updateTimeout);
  }
  const toStart = {
    accountAddress,
    tokenAddresses,
    telegramBotAPIKey,
    telegramChannelID,
    updateTimeout,
  }
  fetch('/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ...toStart })
  }).then(res=>{
    return res.json().then(res=>{
      console.log(res);
    });
  }).catch(error=>{
    console.error('Error with starting: ', error);
  });
}
function stop(){
  fetch('/stop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`
    },
  }).then(res=>{
    return res.json().then(res=>{
      console.log(res);
    });
  }).catch(error=>{
    console.error('Error with stopping: ', error);
  });
}

function getBalance(){
  const accountAddress = localStorage.getItem('accountAddress');
  const tokenAddresses = localStorage.getItem('tokenAddresses');
  fetch(`/balance?accountAddress=${accountAddress}&tokenAddresses=${tokenAddresses}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`
    },
  }).then(res=>{
    return res.json().then(res =>  {
      const stateInfo = document.getElementById('stateInfo');
      const accountInfo = document.getElementById('accountInfo');
      const tokensInfo = document.getElementById('tokensInfo');
      const elements = document.querySelectorAll('[id^="tokenAccount-"]');
      for(el of elements){
        el.remove();
      }
      const stateEl = getOrCreateNodeById('stateEl', 'span');
      const state = res.state
      stateEl.textContent = `State: ${state}`;
      // if(state==='stopped'){
      //   return;
      // }
      stateInfo.appendChild(stateEl);
      document.getElementById('accountElementHead');
      const accountElementHead = getOrCreateNodeById('accountElementHead', 'span');
      accountInfo.appendChild(accountElementHead);
      accountElementHead.textContent = 'Account address: '
      const accountElement = getOrCreateNodeById('accountValue', 'span');
      accountElement.textContent = accountAddress;
      accountInfo.appendChild(accountElement);
      const balanceElement = getOrCreateNodeById('balanceElement','span');
      balanceElement.textContent='Balances:'
      tokensInfo.appendChild(balanceElement);
      for(const i in res.balances){
        const divEl =  document.createElement('div');
        divEl.setAttribute('id', `tokenAccount-${i}`);
        tokensInfo.appendChild(divEl);
        const tokenAddressEl = document.createElement('span');
        tokenAddressEl.textContent='Token address: '
        divEl.appendChild(tokenAddressEl);
        const tokenAddressElement = document.createElement('span');
        tokenAddressElement.textContent = res.balances[i].tokenAddress;
        divEl.appendChild(tokenAddressElement);
        const balanceEl = document.createElement('span');
        balanceEl.textContent=`   Balance: ${res.balances[i].balance} ${res.balances[i].tokenName}`
        divEl.appendChild(balanceEl);
      }
      console.log(res);
    });
  }).catch(error=>{
    console.error('Error with getting balance: ', error);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  if(localStorage){
    document.getElementById('accountAddress').value = localStorage.getItem('accountAddress') || '';
    document.getElementById('tokenAddresses').value = localStorage.getItem('tokenAddresses').replace(',', ', ') || '';
    document.getElementById('telegramBotAPIKey').value = localStorage.getItem('telegramBotAPIKey') || '';
    document.getElementById('telegramChannelID').value = localStorage.getItem('telegramChannelID') || '';
    document.getElementById('updateTimeout').value = localStorage.getItem('updateTimeout') || '';
  }
  document.getElementById('startButton').addEventListener('click', start);
  document.getElementById('stopButton').addEventListener('click', stop);
  document.getElementById('balanceButton').addEventListener('click', getBalance);

  // http://localhost:3200/balance?accountAddress=0xe204c2a3fa87bad5ab167d8c87ba0b69d7fdc663&tokenAddresses=0xdAC17F958D2ee523a2206206994597C13D831ec7,0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
});