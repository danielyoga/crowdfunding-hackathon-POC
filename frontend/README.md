# Web3 Crowdfunding Frontend

A modern, responsive frontend for the Web3 milestone-based crowdfunding platform built on Base L2.

## Features

- 🚀 **Campaign Creation**: Create campaigns with 3 milestones and funding goals
- 💰 **Campaign Funding**: Fund campaigns with ETH using Web3 wallets
- 📊 **Real-time Updates**: Live campaign data and progress tracking
- 🎯 **Milestone Management**: Track and complete campaign milestones
- 🔒 **Secure**: Built with Web3 best practices and smart contract integration
- 📱 **Responsive**: Mobile-first design with modern UI components

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + RainbowKit + Viem
- **UI Components**: Radix UI + Lucide React
- **State Management**: TanStack Query
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH (for testing)

### Installation

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id-here
   NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   NEXT_PUBLIC_SIMPLE_FACTORY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Web3 providers setup
├── components/            # React components
│   ├── CampaignCard.tsx   # Individual campaign display
│   ├── CampaignList.tsx   # Campaign listing
│   ├── CreateCampaignModal.tsx # Campaign creation
│   ├── Hero.tsx          # Landing page hero
│   ├── Navigation.tsx    # Site navigation
│   └── Footer.tsx        # Site footer
├── lib/                   # Utilities and configuration
│   ├── contracts.ts      # Smart contract ABIs and addresses
│   ├── web3-config.ts    # Web3 configuration
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## Smart Contract Integration

The frontend integrates with the following smart contracts:

- **SimpleFactory**: Creates and manages campaigns
- **SimpleCampaign**: Individual campaign logic and funding

### Contract Addresses

Update the contract addresses in `lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  SIMPLE_FACTORY: '0x...' as Address,
  SIMPLE_CAMPAIGN: '0x...' as Address,
}
```

## Key Features

### Campaign Creation
- Set campaign title, description, and funding goal
- Define 3 milestones with descriptions and release percentages
- Pay creation fee (0.01 ETH)
- Automatic campaign deployment

### Campaign Funding
- Fund campaigns with ETH
- Real-time progress tracking
- Milestone-based fund releases
- Refund system for failed campaigns

### Milestone Management
- Founders can complete milestones
- Automatic fund releases based on percentages
- Progress visualization
- State management (Active, Completed, Failed)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Web3 Development

1. **Local Development**:
   - Deploy contracts to localhost (port 8545)
   - Update contract addresses in `lib/contracts.ts`
   - Connect MetaMask to localhost network

2. **Testnet Development**:
   - Deploy to Base Sepolia testnet
   - Get testnet ETH from faucet
   - Update RPC URLs and contract addresses

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `out` directory to your hosting provider

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | Yes |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC URL | Yes |
| `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` | Base Mainnet RPC URL | No |
| `NEXT_PUBLIC_SIMPLE_FACTORY_ADDRESS` | Factory contract address | Yes |

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**:
   - Ensure MetaMask is installed and unlocked
   - Check network configuration
   - Verify RPC URLs are correct

2. **Contract Interaction Issues**:
   - Verify contract addresses are correct
   - Check if contracts are deployed
   - Ensure sufficient ETH for gas fees

3. **Build Issues**:
   - Clear `.next` directory and rebuild
   - Check for TypeScript errors
   - Verify all dependencies are installed

### Getting Help

- Check the [Base Documentation](https://docs.base.org)
- Review [Wagmi Documentation](https://wagmi.sh)
- Join the [Base Discord](https://discord.gg/buildonbase)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the Web3 community**

*Simple, effective milestone crowdfunding that focuses on core functionality*





