import { useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { OpenloginAdapter, OpenloginLoginParams } from "@web3auth/openlogin-adapter";
import { WalletConnectV2Adapter, getWalletConnectV2Settings } from "@web3auth/wallet-connect-v2-adapter";
import { WalletConnectModal } from "@walletconnect/modal";
import "./App.css";
import RPC from "./web3RPC"; 

const sns_getSupportedRecords: any[] = [];

function uiConsole(...args: any[]): void {
  const el = document.querySelector("#console>p");
  if (el) {
    el.innerHTML = JSON.stringify(args || {}, null, 2);
  }
}

const axios = require("axios");
//const apiResponse = [];

(() => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  const data = {
    jsonrpc: "2.0",
    id: 42,
    method: "sns_getSupportedRecords",
    params: ["HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA"],
  };
  axios
    .post(
      "https://rough-flashy-rain.solana-mainnet.quiknode.pro/855a82dd06fc221e91a3d719dd7ac2c906d6343c/",
      data,
      config
    )
    .then(function (response: any) {
      // handle success
      console.log(response.data.result);
      uiConsole(response.data.result);
      sns_getSupportedRecords.push(response.data.result);

    })
    .catch((err: any) => {
      // handle error
      console.log(err);
    });
})();

const clientId = "BLBNWswqgg8drweTanr7Hh43nRQwD5gTK4ieF4bOaWsoJdCVqnydwieDE6kAVrgL9oieQQ-Fs05RI4K-GnTWPu8"; // get from https://dashboard.web3auth.io

function App() {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(false);
  

  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0x1",
          rpcTarget: "https://eth.llamarpc.com",
          mode: 'no-cors',
          displayName: "Ethereum Mainnet",
          blockExplorer: "https://goerli.etherscan.io",
          ticker: "ETH",
          tickerName: "Ethereum",
        };
        const web3auth = new Web3AuthNoModal({
          clientId,
          chainConfig,
          web3AuthNetwork: "sapphire_devnet",
        });

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });
        
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            clientId: "BLBNWswqgg8drweTanr7Hh43nRQwD5gTK4ieF4bOaWsoJdCVqnydwieDE6kAVrgL9oieQQ-Fs05RI4K-GnTWPu8", //Optional - Provide only if you haven't provided it in the Web3Auth Instantiation Code
            uxMode: "popup",
            loginConfig: {
              jwt: {
                verifier: "345-tesdt",
                typeOfLogin: "jwt",
                clientId: "64qOEG8JGyQd5h9NMOxnIYOOg9KIxdh2",
              },
            },
          },
          privateKeyProvider,
        });
        
        web3auth.configureAdapter(openloginAdapter);
        setWeb3auth(web3auth);

        // adding wallet connect v2 adapter
        const defaultWcSettings = await getWalletConnectV2Settings("eip155", [1], "04309ed1007e77d1f119b85205bb779d");
        const walletConnectModal = new WalletConnectModal({ projectId: "04309ed1007e77d1f119b85205bb779d" });
        const walletConnectV2Adapter = new WalletConnectV2Adapter({
          adapterSettings: {
            qrcodeModal: walletConnectModal,
            ...defaultWcSettings.adapterSettings,
          },
          loginSettings: { ...defaultWcSettings.loginSettings },
        });

        web3auth.configureAdapter(walletConnectV2Adapter);

        await web3auth.init();
        setProvider(web3auth.provider);
        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: "jwt",
      extraLoginOptions: {
        domain: "https://dev-4asx36bqgfm61bfz.us.auth0.com", // Pass on the Auth0 `Domain` here
        verifierIdField: "sub", // Pass on the field name of the `sub` field in the JWT
        connection: "windowslive",
      }    });
    setProvider(web3authProvider);
  };

  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.authenticateUser();
    ;
    uiConsole(sns_getSupportedRecords[0]);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
  };

  const getChainId = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const chainId = await rpc.getChainId();
    uiConsole(chainId);
  };

  const addChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const newChain = {
      chainId: "0x5",
      displayName: "Goerli",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      tickerName: "Goerli",
      ticker: "ETH",
      decimals: 18,
      rpcTarget: "https://rpc.ankr.com/eth_goerli",
      blockExplorer: "https://goerli.etherscan.io",
    };
    await web3auth?.addChain(newChain);
    uiConsole("New Chain Added");
  };

  const switchChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    await web3auth?.switchChain({ chainId: "0x5" });
    uiConsole("Chain Switched");
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendTransaction();
    uiConsole(receipt);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const signedMessage = await rpc.signMessage();
    uiConsole(signedMessage);
  };

  const getPrivateKey = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    uiConsole(privateKey);
  };



  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={authenticateUser} className="card">
            Get Supported Token
          </button>
        </div>
        <div>
          <button onClick={getChainId} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={addChain} className="card">
            Add Chain
          </button>
        </div>
        <div>
          <button onClick={switchChain} className="card">
            Switch Chain
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={getPrivateKey} className="card">
            Get Private Key
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      <button onClick={login} className="card">
        Login
      </button>
    </>
  );

  return (
    <div className="container">
      <h1 className="title">
      Bonfida Quest
      </h1>
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
    </div>
  );
}

export default App;
