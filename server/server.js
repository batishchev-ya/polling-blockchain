const path = require('path');
const util = require('util');

const express = require('express');
const {ethers} = require('ethers');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const jwtSignAsync = util.promisify(jwt.sign);
const jwtVerifyAsync = util.promisify(jwt.verify);

const jwtSecret = process.env.JWT_SECRET || 'supersecretsecret';
const port = process.env.PORT || 3200;

const {overrideConsoleWithTimestamp} = require('../utils/consoleProxy');
// оверрайд консоли чтобы у сообщений были таймштампы
overrideConsoleWithTimestamp();

const {db} = require('../db/db.js');
const {startPolling, stopPolling, getState} = require('../poller/index');
const whiteList = require('../whitelist.json');

const app = express();
app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

async function verifyToken(req,res, next){
  if(!req.headers['authorization'] || !req.headers['authorization'].startsWith('Bearer ')){
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ message: 'Provide correct auth bearer token' }));
    return;
  }
  const token = req.headers['authorization'].split(' ')[1];

  try {
    const payload = await jwtVerifyAsync(token, jwtSecret);
    const user = await db.model('Users').findByPk(payload.id);
    if(!user){
      throw new Error('No user found');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

app.post('/auth', async (req,res) => {
  const { signature, publicAddress } = req.body;
	if (!signature || !publicAddress) {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ message: 'signature and publicAddress is required' }));
		return;
	}

  const existingUser = await db.model('Users').findOne({
    where: {
      publicAddress
    }
  });

  if (!existingUser) {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ message: 'no User found with current publicAddress' }));
    return;
  }
  
  const msg = `nonce: ${existingUser.nonce}`;
  const signedAddres = ethers.verifyMessage(msg, signature);
  if(signedAddres.toLowerCase()!==publicAddress.toLowerCase()){
    res.writeHead(401, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ message: 'Signature verification failed' }));
    return;
  }
  const token = await jwtSignAsync({id: existingUser.id, publicAddress}, jwtSecret);

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({token}));
});

app.post('/users', async (req, res) => {
  let user;
  const publicAddress = req.body.publicAddress;
  const existingUser = await db.model('Users').findOne({
    where: {
      publicAddress
    }
  });

  if(!existingUser){
    user = await db.model('Users').create({
      publicAddress
    });
  } else {
    user = existingUser;
  }
  res.writeHead(201, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({...user.toJSON()}));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/init/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login/index.html'));
});

const checkAddressValidity = (address, type, res) => {
  if(!ethers.isAddress(address)){
    res.writeHead(400, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'please provide valid ' + type + ' address'}));
    return false;
  }
  return true;
}

app.post('/start', verifyToken, async (req, res) => {
  console.log(req.body);
  const {tokenAddresses, accountAddress} = req.body;
  const updateTimeout = req.body.updateTimeout === '' ? 1 : +req.body.updateTimeout;
  if((tokenAddresses.length===1 && tokenAddresses[0]==='') || accountAddress===''){
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'please provide token Addresses or account Address'}));
    return;
  }
  
  if(!checkAddressValidity(accountAddress, 'account', res)){
    return 
  };
  
  for(const tokenAddress of tokenAddresses){
    if(!checkAddressValidity(tokenAddress, 'token', res)){
      return
    }
  }
  if(!whiteList.includes(accountAddress)){
    res.writeHead(401, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'account address is not in whitelist'}));
    return;
  }
  const timeInterval = updateTimeout * 1000 * 60;
  const result = startPolling({tokenAddresses, accountAddress, timeInterval});
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({result}));
});

app.post('/stop', verifyToken, (req, res) => {
  console.log(req.body);
  const result = stopPolling();
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({result}));
});

app.get('/balance', verifyToken, async (req, res) => {
  const { accountAddress} = req.query;
  const tokenAddresses = req.query.tokenAddresses.split(',');
  if(!tokenAddresses || !accountAddress ||(tokenAddresses.length===1 && tokenAddresses[0]==='') || accountAddress===''){
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'please provide token Addresses or account Address as query param'}));
    return;
  }
  const balances = await db.model('Balances').findAll({
    where: {
      accountAddress, 
      tokenAddress: {
        [db.Op.in]: tokenAddresses
      }
    }
  });

  const result = {
    state: getState(), 
    balances:[]
  };

  for(const balanceKey of Object.keys(balances)){
    result.balances.push(balances[balanceKey].toJSON())
  }
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(result));
});

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});