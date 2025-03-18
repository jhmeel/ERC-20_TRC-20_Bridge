import React, { useState, useEffect, useMemo } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { ArrowLeftRight, ChevronDown, Settings, AlertCircle, Info } from 'lucide-react';
import { ethers } from 'ethers';
import { useTheme } from 'next-themes';
import { useAccount, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import Tooltip from '@/components/ui/Tooltip';

interface Token {
  symbol: string;
  name: string;
  logo: string;
  chain: 'ERC20' | 'TRC20';
  balance?: string;
  address: string;
  decimals: number;
}

const Bridge: NextPage = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [showFromTokenList, setShowFromTokenList] = useState(false);
  const [showToTokenList, setShowToTokenList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string>('0');
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});

  const tokens: Token[] = [
  { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', 
    chain: 'ERC20', 
    decimals: 18, 
    address: '0x0000000000000000000000000000000000000000' 
  },
  { 
    symbol: 'USDT', 
    name: 'Tether USD', 
    logo: 'https://assets.coingecko.com/coins/images/325/small/tether.png', 
    chain: 'ERC20', 
    decimals: 6, 
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7' 
  },
  { 
    symbol: 'USDC', 
    name: 'USD Coin', 
    logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', 
    chain: 'ERC20', 
    decimals: 6, 
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' 
  },
  { 
    symbol: 'BNB', 
    name: 'Binance Coin (ERC20)', 
    logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', 
    chain: 'ERC20', 
    decimals: 18, 
    address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52' 
  },
  { 
    symbol: 'TRX', 
    name: 'TRON', 
    logo: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', 
    chain: 'TRC20', 
    decimals: 6, 
    address: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb' 
  },
  { 
    symbol: 'USDT', 
    name: 'Tether USD', 
    logo: 'https://assets.coingecko.com/coins/images/325/small/tether.png', 
    chain: 'TRC20', 
    decimals: 6, 
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' 
  },
  { 
    symbol: 'USDC', 
    name: 'USD Coin', 
    logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', 
    chain: 'TRC20', 
    decimals: 6, 
    address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8' 
  },
  { 
    symbol: 'BTT', 
    name: 'BitTorrent', 
    logo: 'https://assets.coingecko.com/coins/images/22457/small/btt_logo.png', 
    chain: 'TRC20', 
    decimals: 18, 
    address: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4' 
  }
];
  useEffect(() => {
    if (isConnected) {
      fetchBalances();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (fromToken && toToken && amount && parseFloat(amount) > 0) {
      calculateEstimatedGas();
    } else {
      setEstimatedGas('0');
    }
  }, [fromToken, toToken, amount]);

  const fetchBalances = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const balances: {[key: string]: string} = {};
      
      //  demo: set sample balances
      
      tokens.forEach(token => {
        const randomBalance = (Math.random() * 100).toFixed(token.symbol === 'ETH' ? 4 : 2);
        balances[`${token.symbol}-${token.chain}`] = randomBalance;
      });
      
      setTokenBalances(balances);
      
    
      if (fromToken) {
        const token = tokens.find(t => 
          t.symbol === fromToken.symbol && t.chain === fromToken.chain
        );
        if (token) {
          const key = `${token.symbol}-${token.chain}`;
          setFromToken({
            ...token,
            balance: balances[key] || '0'
          });
        }
      }
      
      // Update to token balance if selected
      if (toToken) {
        const token = tokens.find(t => 
          t.symbol === toToken.symbol && t.chain === toToken.chain
        );
        if (token) {
          const key = `${token.symbol}-${token.chain}`;
          setToToken({
            ...token,
            balance: balances[key] || '0'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimatedGas = async () => {
    if (!fromToken || !toToken || !amount) return;
    
    try {
      
      const baseGas = 0.0018;
      const amountValue = parseFloat(amount);
      const amountFactor = amountValue * 0.00005;
      const crossChainFactor = fromToken.chain !== toToken.chain ? 0.0025 : 0.0008;
      
      //demo:  slight randomness to make it feel more realistic, since im using demo data 
      const randomFactor = Math.random() * 0.0005;
      const total = (baseGas + amountFactor + crossChainFactor + randomFactor).toFixed(5);
      setEstimatedGas(total);
    } catch (error) {
      console.error('Error calculating gas:', error);
      setEstimatedGas('0.00025');
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    
    try {
      // First try MetaMas
      connect({ connector: new MetaMaskConnector() });
    } catch (error) {
      // Fall back to injected provider
      try {
        connect({ connector: new InjectedConnector() });
      } catch (secondError) {
        // Last resort try WalletConnect
        try {
          connect({ 
            connector: new WalletConnectConnector({
              options: {
                projectId: 'your-project-id',
              },
            }) 
          });
        } catch (thirdError) {
          console.error('Failed to connect wallet:', thirdError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const swapTokens = () => {
    if (!fromToken || !toToken) return;
    
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const selectFromToken = (token: Token) => {
    const selectedToken = {
      ...token,
      balance: tokenBalances[`${token.symbol}-${token.chain}`] || '0'
    };
    
    setFromToken(selectedToken);
    setShowFromTokenList(false);
    
    // If same token selected on both sides, swap the to token
    if (toToken && token.symbol === toToken.symbol && token.chain === toToken.chain) {
      const otherChainToken = tokens.find(t => 
        t.symbol === token.symbol && t.chain !== token.chain
      );
      
      if (otherChainToken) {
        setToToken({
          ...otherChainToken,
          balance: tokenBalances[`${otherChainToken.symbol}-${otherChainToken.chain}`] || '0'
        });
      }
    }
  };

  const selectToToken = (token: Token) => {
    const selectedToken = {
      ...token,
      balance: tokenBalances[`${token.symbol}-${token.chain}`] || '0'
    };
    
    setToToken(selectedToken);
    setShowToTokenList(false);
    
    // If same token selected on both sides, swap the from token
    if (fromToken && token.symbol === fromToken.symbol && token.chain === fromToken.chain) {
      const otherChainToken = tokens.find(t => 
        t.symbol === token.symbol && t.chain !== token.chain
      );
      
      if (otherChainToken) {
        setFromToken({
          ...otherChainToken,
          balance: tokenBalances[`${otherChainToken.symbol}-${otherChainToken.chain}`] || '0'
        });
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Prevent more than 8 decimal places
      const parts = value.split('.');
      if (parts.length === 2 && parts[1].length > 8) {
        return;
      }
      
      setAmount(value);
    }
  };

  const handleMaxAmount = () => {
    if (fromToken?.balance) {
      setAmount(fromToken.balance);
    }
  };

  const executeBridge = async () => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !isConnected) {
      return;
    }
    
    // Validate balance
    if (fromToken.balance && parseFloat(amount) > parseFloat(fromToken.balance)) {
      alert('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setTransactionStatus('pending');

    try {
    
      // demo: simulate bridge contract call with a timeout
      
      // First simulate approval
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Then simulate bridge transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update balances to simulate transfer
      const newBalances = { ...tokenBalances };
      
      // Decrease from token balance
      const fromKey = `${fromToken.symbol}-${fromToken.chain}`;
      const oldFromBalance = parseFloat(newBalances[fromKey] || '0');
      newBalances[fromKey] = Math.max(0, oldFromBalance - parseFloat(amount)).toFixed(
        fromToken.symbol === 'ETH' ? 4 : 2
      );
      
      // Increase to token balance after delay (to simulate bridge time)
      setTimeout(() => {
        const toKey = `${toToken.symbol}-${toToken.chain}`;
        const oldToBalance = parseFloat(tokenBalances[toKey] || '0');
        const updatedBalances = { ...tokenBalances };
        updatedBalances[toKey] = (oldToBalance + parseFloat(amount)).toFixed(
          toToken.symbol === 'ETH' ? 4 : 2
        );
        
        setTokenBalances(updatedBalances);
      }, 5000);
      
      setTokenBalances(newBalances);
      setTransactionStatus('success');
      
      // Update token balances in state objects
      if (fromToken) {
        setFromToken({
          ...fromToken,
          balance: newBalances[fromKey]
        });
      }
    } catch (error) {
      console.error('Bridge transaction failed:', error);
      setTransactionStatus('error');
    } finally {
      setIsLoading(false);
      
      // Reset form after successful transaction
      if (transactionStatus === 'success') {
        setTimeout(() => {
          setAmount('');
          setTransactionStatus('idle');
        }, 5000);
      }
    }
  };

  const filteredFromTokens = useMemo(() => {
    return tokens.map(token => ({
      ...token,
      balance: tokenBalances[`${token.symbol}-${token.chain}`] || '0'
    }));
  }, [tokens, tokenBalances]);
  
  const filteredToTokens = useMemo(() => {
    return tokens
      .filter(token => !fromToken || token.chain !== fromToken.chain || token.symbol !== fromToken.symbol)
      .map(token => ({
        ...token,
        balance: tokenBalances[`${token.symbol}-${token.chain}`] || '0'
      }));
  }, [tokens, tokenBalances, fromToken]);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const receivedAmount = useMemo(() => {
    if (!amount || !fromToken || !toToken) return '';
    
    const value = parseFloat(amount);
    if (isNaN(value)) return '';
    
    // Calculate fees
    const bridgeFee = value * 0.002; // 0.2% fee
    
    // Calculate final amount
    let finalAmount = value - bridgeFee;
    
    // Round to appropriate decimals
    if (toToken.symbol === 'ETH') {
      finalAmount = Math.floor(finalAmount * 10000) / 10000;
    } else {
      finalAmount = Math.floor(finalAmount * 100) / 100;
    }
    
    return finalAmount.toString();
  }, [amount, fromToken, toToken]);

  return (
    <>
      <Head>
        <title>Cross-Chain Bridge | ERC20-TRC20</title>
        <meta name="description" content="Bridge your assets between ERC-20 and TRC-20 chains securely and efficiently" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bridge</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Transfer tokens seamlessly between ERC-20 and TRC-20 chains
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">Cross-Chain Bridge</h2>
                <div className="flex items-center">
                  {isConnected && (
                    <span className="mr-3 text-sm font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      {formatAddress(address || '')}
                    </span>
                  )}
                  <Tooltip content="Settings">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Settings size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
                  {fromToken && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Balance: {fromToken.balance} {fromToken.symbol}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {fromToken && isConnected && (
                      <button 
                        onClick={handleMaxAmount}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setShowFromTokenList(true)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    {fromToken ? (
                      <>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                          <Image 
                            src={fromToken.logo} 
                            alt={fromToken.symbol}
                            width={24}
                            height={24}
                          />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{fromToken.symbol}</span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{fromToken.chain}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                        <span className="font-medium text-gray-900 dark:text-white">Select</span>
                      </>
                    )}
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center my-4">
                <button 
                  onClick={swapTokens}
                  disabled={!fromToken || !toToken}
                  className={`p-2 rounded-full border border-gray-200 dark:border-gray-700 
                    ${(fromToken && toToken) 
                      ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                      : 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'}`}
                >
                  <ArrowLeftRight size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                  {toToken && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Balance: {toToken.balance} {toToken.symbol}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={receivedAmount}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setShowToTokenList(true)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    {toToken ? (
                      <>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                          <Image 
                            src={toToken.logo} 
                            alt={toToken.symbol}
                            width={24}
                            height={24}
                          />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{toToken.symbol}</span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{toToken.chain}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                        <span className="font-medium text-gray-900 dark:text-white">Select</span>
                      </>
                    )}
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {fromToken && toToken && amount && parseFloat(amount) > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transaction Details</h3>
                  
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Bridge Fee</span>
                    <span className="text-gray-900 dark:text-white">0.2%</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Estimated Gas</span>
                    <span className="text-gray-900 dark:text-white">{estimatedGas} ETH</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Estimated Time</span>
                    <span className="text-gray-900 dark:text-white">
                      {fromToken.chain === toToken.chain ? '~5 minutes' : '~30 minutes'}
                    </span>
                  </div>
                </div>
              )}

              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'Connect Wallet'
                  )}
                </button>
              ) : (
                <button
                  onClick={executeBridge}
                  disabled={!fromToken || !toToken || !amount || parseFloat(amount) <= 0 || isLoading || transactionStatus === 'pending'}
                  className={`w-full py-3 px-4 font-medium rounded-lg transition duration-200 flex items-center justify-center
                    ${(!fromToken || !toToken || !amount || parseFloat(amount) <= 0 || isLoading || transactionStatus === 'pending')
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {isLoading || transactionStatus === 'pending' ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {transactionStatus === 'pending' ? 'Processing...' : 'Bridging...'}
                    </span>
                  ) : (
                    'Bridge Tokens'
                  )}
                </button>
              )}

              {transactionStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Transaction Successful</p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      Your tokens are being transferred. You'll receive {receivedAmount} {toToken?.symbol} in approximately {fromToken?.chain === toToken?.chain ? '5' : '30'} minutes.
                    </p>
                  </div>
                </div>
              )}

              {transactionStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                  <AlertCircle size={20} className="text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Transaction Failed</p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      There was an error processing your transaction. Please try again later.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex">
              <Info size={20} className="text-blue-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">About Bridge</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  This bridge allows seamless token transfers between Ethereum (ERC-20) and TRON (TRC-20) blockchains. 
                  Cross-chain transfers typically take 20-30 minutes to complete, and same-chain transfers around 5 minutes. 
                  A 0.2% fee is applied to all bridge transactions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showFromTokenList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowFromTokenList(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Token</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowFromTokenList(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                placeholder="Search token name or address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="overflow-y-auto max-h-[50vh]">
              {filteredFromTokens.map((token) => (
                <button
                  key={`${token.symbol}-${token.chain}`}
                  className="w-full flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => selectFromToken(token)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3 bg-gray-100 dark:bg-gray-700">
                    <Image 
                      src={token.chain === 'ERC20' ? 
                        `https://assets.coingecko.com/coins/images/${token.symbol === 'ETH' ? '279/ethereum' : token.symbol === 'USDT' ? '325/tether' : '6319/usd-coin'}/thumb.png` : 
                        `https://assets.coingecko.com/coins/images/${token.symbol === 'TRX' ? '1094/tron' : '325/tether'}/thumb.png`
                      } 
                      alt={token.symbol}
                      width={32}
                      height={32}
                    />
                  </div>
                  <div className="flex-grow text-left">
                    <div className="font-medium text-gray-900 dark:text-white">{token.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{token.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{token.balance}</div>
                    <div className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{token.chain}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showToTokenList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowToTokenList(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Token</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowToTokenList(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                placeholder="Search token name or address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="overflow-y-auto max-h-[50vh]">
              {filteredToTokens.map((token) => (
                <button
                  key={`${token.symbol}-${token.chain}`}
                  className="w-full flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => selectToToken(token)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3 bg-gray-100 dark:bg-gray-700">
               <Image 
                 src={token.logo} 
                  alt={token.symbol}
                   width={32}
                   height={32}
                    />
                  </div>
                  <div className="flex-grow text-left">
                    <div className="font-medium text-gray-900 dark:text-white">{token.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{token.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{token.balance}</div>
                    <div className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{token.chain}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Bridge;
