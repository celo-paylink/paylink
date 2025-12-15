# Paylink 🔗

> Secure Web3 payment links on the Celo blockchain

Paylink is a decentralized application that enables users to create shareable payment links on the Celo blockchain. Send crypto to anyone with just a link - no wallet address required!

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://paylinkfrontend.vercel.app/)
[![Farcaster](https://img.shields.io/badge/Launch-Farcaster-purple)](https://paylinkfrontend.vercel.app/)

## 📋 Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Features](#features)
- [Usage Guide](#usage-guide)
- [Farcaster Integration](#farcaster-integration)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Smart Contract](#smart-contract)
- [Contributing](#contributing)

---

## 🎯 Overview

Paylink solves the problem of sending cryptocurrency to recipients who may not have a wallet or may not want to share their address publicly. Instead of asking for wallet addresses, you can:

1. **Create** a payment link with locked funds
2. **Share** the link via any channel (email, social media, QR code)
3. **Claim** the funds by simply clicking the link and connecting a wallet

Perfect for:
- 🎁 Sending crypto gifts
- 💰 Splitting bills
- 🎉 Event giveaways
- 💸 Distributing rewards
- 🔐 Escrow payments with expiry

---

## 🔄 How It Works

### Creating a Paylink

```
You → Lock Funds → Smart Contract → Generate Link
```

1. Connect your wallet to the Celo network
2. Specify the amount to send
3. Set an expiry time (optional)
4. Funds are locked in a smart contract
5. Receive a unique claim code and shareable link

### Claiming Funds

```
Recipient → Click Link → Connect Wallet → Claim Funds
```

1. Recipient clicks the payment link
2. Connects their wallet (any Celo-compatible wallet)
3. Claims the funds with one click
4. Funds transfer from smart contract to recipient's wallet

### Reclaiming Expired Funds

```
You → Check Expiry → Reclaim → Funds Returned
```

1. If the link expires before being claimed
2. Original sender can reclaim the locked funds
3. Smart contract validates expiry and ownership
4. Funds return to sender's wallet

---

## ✨ Features

### Core Features

- ✅ **One-Click Payment Links** - Create shareable payment links in seconds
- ✅ **No Wallet Required (Sender)** - Recipients don't need to share addresses
- ✅ **Expiry Mechanism** - Set automatic expiration for unclaimed funds
- ✅ **Reclaim Function** - Get your money back if unclaimed after expiry
- ✅ **QR Code Generation** - Share via QR codes for in-person payments
- ✅ **Dashboard** - Track all your created and claimed paylinks
- ✅ **Real-time Status** - See live status of your payment links

### Web3 Features

- 🔐 **Smart Contract Security** - Funds locked in auditable contracts
- ⛓️ **Celo Blockchain** - Low fees, fast transactions, mobile-first
- 🌐 **Decentralized** - No intermediaries, self-custodial
- 🔑 **Multi-Wallet Support** - RainbowKit integration (MetaMask, Coinbase, WalletConnect)
- 🎯 **Farcaster Integration** - Launch as mini app inside Farcaster client

### UX Features

- 🎨 **Modern CLI Theme** - Hacker-inspired terminal aesthetic
- 📱 **Fully Responsive** - Works on mobile, tablet, and desktop
- ⚡ **Fast Performance** - Built with Vite for lightning-fast loads
- 🌙 **Dark Mode** - Eye-friendly dark theme by default
- ♿ **Accessible** - ARIA labels and keyboard navigation

---

## 📖 Usage Guide

### Creating a Paylink

1. **Navigate to Create Page**
   - Click "Create Paylink" from the home page
   - Or visit `/create` directly

2. **Connect Your Wallet**
   - Click the "Connect Wallet" button
   - Select your wallet provider
   - Approve the connection

3. **Enter Payment Details**
   - Amount: Specify how much CELO to send
   - Expiry: Set when unclaimed funds can be reclaimed (optional)
   - Message: Add a note for the recipient (optional)

4. **Lock Funds**
   - Click "Create Paylink"
   - Approve the transaction in your wallet
   - Wait for transaction confirmation

5. **Share the Link**
   - Copy the generated claim link
   - Share via any channel (email, messaging, social media)
   - Or download the QR code for in-person sharing

### Claiming a Paylink

1. **Open the Claim Link**
   - Click the link shared with you
   - Or manually enter claim code at `/claim`

2. **Connect Wallet**
   - Connect the wallet where you want to receive funds
   - Any Celo-compatible wallet works

3. **Claim Funds**
   - Review payment details
   - Click "Claim Funds"
   - Approve transaction in wallet
   - Funds transfer to your wallet instantly!

### Reclaiming Expired Funds

1. **Check Dashboard**
   - Visit `/dashboard` to see all your paylinks
   - Expired and unclaimed links are marked

2. **Navigate to Reclaim**
   - Click "Reclaim" on an expired link
   - Or visit `/reclaim/:claimCode`

3. **Reclaim Funds**
   - Verify the link is expired and unclaimed
   - Click "Reclaim Funds"
   - Approve transaction
   - Funds return to your wallet

---

## 🎭 Farcaster Integration

Paylink is available as a **Mini App on Farcaster**!

### Features in Farcaster

- 🚀 Launch from casts (rich embeds)
- 💰 Create payment links inside Farcaster
- 🔐 Auto-connect with Farcaster wallet
- 📤 Share claims directly to feed via compose cast
- ✨ Native splash screen and branding

### Using in Farcaster

1. Open a cast with a Paylink URL
2. Click "🔗 Open Paylink" button
3. App launches with Farcaster wallet connected
4. Create or claim paylinks seamlessly
5. Share results back to Farcaster feed

### For Developers

See [FARCASTER_SETUP.md](./FARCASTER_SETUP.md) for integration details.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.11.0 or higher
- Yarn, npm, or pnpm package manager
- A Celo-compatible wallet (MetaMask recommended)
- Some CELO tokens for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/celo-paylink/paylink.git

# Navigate to frontend directory
cd paylink/paylink_frontend

# Install dependencies
yarn install

# Start development server
yarn dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
yarn build

# Preview production build
yarn preview
```

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi 2.x + Viem 2.x
- **Wallet**: RainbowKit 2.2
- **State Management**: TanStack Query 5
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **QR Codes**: qrcode.react
- **Icons**: Lucide React + React Icons
- **Notifications**: React Toastify

### Blockchain

- **Network**: Celo (Mainnet)
- **Smart Contracts**: Solidity
- **Web3 Provider**: Wagmi + Viem
- **Wallet Connector**: RainbowKit + Farcaster Mini App Connector

### Farcaster

- **SDK**: @farcaster/miniapp-sdk
- **Wallet Connector**: @farcaster/miniapp-wagmi-connector

### Deployment

- **Hosting**: Vercel
- **CI/CD**: GitHub Actions (optional)

---

## 💻 Development

### Project Structure

```
paylink_frontend/
├── public/              # Static assets
│   ├── .well-known/    # Farcaster manifest
│   ├── og-image.png    # Social sharing image
│   └── splash-icon.png # Farcaster splash icon
├── src/
│   ├── assets/         # Images, fonts
│   ├── components/     # Reusable components
│   │   ├── app-provider.tsx
│   │   ├── auth-guard.tsx
│   │   ├── connect-wallet-btn.tsx
│   │   ├── grid-background.tsx
│   │   ├── navbar.tsx
│   │   └── step-card.tsx
│   ├── context/        # React contexts
│   │   ├── auth-context.tsx
│   │   ├── constant.tsx
│   │   ├── use-auth.tsx
│   │   └── use-farcaster.tsx
│   ├── layouts/        # Page layouts
│   │   └── Layout.tsx
│   ├── libs/           # Utilities and configs
│   │   ├── config.ts         # Wagmi config
│   │   ├── constants.ts
│   │   ├── contract.ts       # Smart contract ABI
│   │   └── farcaster-sdk.ts  # Farcaster SDK
│   ├── pages/          # Route pages
│   │   ├── About.tsx
│   │   ├── Claim.tsx
│   │   ├── ClaimHome.tsx
│   │   ├── Create.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Home.tsx
│   │   ├── NotFound.tsx
│   │   ├── Reclaim.tsx
│   │   └── ReclaimHome.tsx
│   ├── services/       # API services
│   │   ├── api.ts
│   │   ├── paylink.ts
│   │   └── user.ts
│   ├── utils/          # Helper functions
│   │   └── claim-code.ts
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Available Scripts

```bash
# Development
yarn dev              # Start dev server
yarn build            # Build for production
yarn preview          # Preview production build
yarn lint             # Run ESLint

# Type checking
tsc -b                # Type check without emitting
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Custom RPC endpoints
VITE_CELO_RPC_URL=https://forno.celo.org

# Optional: Analytics
VITE_ANALYTICS_ID=your-analytics-id
```

### Coding Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: React + TypeScript rules
- **Formatting**: Prettier (recommended)
- **Naming**: PascalCase for components, camelCase for functions
- **Components**: Functional components with hooks
- **Styling**: Tailwind utility classes + CSS variables

---

## 📜 Smart Contract

### Contract Details

- **Network**: Celo Mainnet
- **Language**: Solidity ^0.8.x
- **Features**:
  - Create paylinks with locked funds
  - Set expiry timestamps
  - Claim funds with unique codes
  - Reclaim expired unclaimed funds
  - Event emissions for tracking

### Key Functions

```solidity
// Create a new paylink
function createPaylink(uint256 expiry) payable returns (bytes32 claimCode)

// Claim funds with code
function claim(bytes32 claimCode) external

// Reclaim expired funds
function reclaim(bytes32 claimCode) external
```

### Security Features

- ✅ Reentrancy protection
- ✅ Access control (only sender can reclaim)
- ✅ Expiry validation
- ✅ Claim status tracking
- ✅ Event logging for transparency

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Your Changes**
4. **Commit with Conventional Commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Write clean, documented code
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Test on Celo testnet before mainnet

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live App**: https://paylinkfrontend.vercel.app/
- **GitHub**: https://github.com/celo-paylink/paylink
- **Telegram**: https://t.me/c/3686154526/3
- **Celo Network**: https://celo.org
- **Farcaster Setup**: [FARCASTER_SETUP.md](./FARCASTER_SETUP.md)

---

## 💬 Support

Need help? Have questions?

- 📖 Check the [documentation](./FARCASTER_SETUP.md)
- 💬 Join our [Telegram](https://t.me/c/3686154526/3)
- 🐛 Report bugs via [GitHub Issues](https://github.com/celo-paylink/paylink/issues)
- 🌐 Explore [Celo Docs](https://docs.celo.org)

---

## 🙏 Acknowledgments

- **Celo Foundation** - For building an amazing mobile-first blockchain
- **Farcaster** - For the Mini Apps platform
- **RainbowKit** - For the excellent wallet connection UX
- **Vercel** - For seamless deployment

---

<div align="center">

**Built with ❤️ by developers, for developers**

⭐ Star us on GitHub if you find this useful!

</div>
