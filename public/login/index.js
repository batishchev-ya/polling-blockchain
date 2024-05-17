async function login() {
  try {
    if(window.ethereum){
      // const provider = window.ethereum;
      // const accounts = await provider.request({ method: 'eth_requestAccounts' });
      // // console.log('Connected accounts :', accounts);
      // const publicAddress = accounts[0].toLowerCase(); // Get the first account
      // // console.log('Connected account:', account);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const publicAddress = await signer.getAddress();
      console.log("publicAddress:", publicAddress);
      const response = await fetch('/users', {
        body: JSON.stringify({ publicAddress }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const user = await response.json();
      const signature = await signer.signMessage(`nonce: ${user.nonce}`);
      const tokenResponse = await fetch('/auth', {
        body: JSON.stringify({ publicAddress, signature }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const accessToken = await tokenResponse.json();
      localStorage.setItem('accessToken', accessToken.token);
      window.location = '/'
      // console.log(accessToken);
    }
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('login').addEventListener('click', login);
  
});