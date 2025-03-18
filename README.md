# ERC20-TRC20 Cross-Chain Bridge

## Overview

I implemented a cross-chain bridge between Ethereum (ERC20) and TRON (TRC20) networks. The bridge allows users to transfer tokens seamlessly between these two blockchain ecosystems with a user-friendly interface that handles wallet connections, token selection, and transaction processing.

## Features

- **Cross-Chain Token Transfers**: Bridge tokens between Ethereum and TRON networks
- **Wallet Integration**: Connect with MetaMask, WalletConnect, or any injected Web3 provider
- **Demo Gas Estimation**: Dynamic calculation of gas fees based on transaction type
- **Token Selection**: Support for multiple tokens including ETH, USDT, USDC, and TRX
- **Transaction Status Tracking**: Visual feedback on transaction progress
- **Dark Mode Support**: Responsive design with both light and dark theme options
- **Balance Display**: Real-time token balance updates


### Installation

1. Clone the repository:
   ```
   https://github.com/jhmeel/ERC-20_TRC-20_Bridge.git
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```


## key files modified/created
- `pages/admin/products/bridge/page.tsx`
- layouts.tsx
