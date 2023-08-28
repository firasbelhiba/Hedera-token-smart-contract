
# Hedera Hashgraph Smart Contract Deployment

Deploy and manage smart contracts on the Hedera Hashgraph network with this project. Create fungible tokens, mint, associate, and transfer them with ease.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Setup](#-setup)
- [Running the Script](#-running-the-script)
- [Features](#-features)
- [Notes](#-notes)
- [License](#-license)

## 🔧 Prerequisites

- **Node.js**: Ensure you have Node.js installed.
- **npm**: Node package manager.
- **Hedera Hashgraph SDK**: This project uses the Hedera Hashgraph SDK for JavaScript.

## 🚀 Setup

1. **Clone the Repository**:
   \`\`\`bash
   git clone [your-repository-link]
   cd [your-repository-directory]
   \`\`\`

2. **Install Dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Variables**:
   - Copy the \`.env.example\` file (if provided) to \`.env\`.
   - Fill in the required environment variables:
     \`\`\`
     OPERATOR_ID=0.0.xxxxx
     OPERATOR_PVKEY=your-operator-private-key
     TREASURY_ID=0.0.xxxxx
     TREASURY_PVKEY=your-treasury-private-key
     OLFA_ID=0.0.xxxxx
     OLFA_PVKEY=your-olfa-private-key
     \`\`\`

## 🖥️ Running the Script

Execute the smart contract deployment and token operations:

\`\`\`bash
node [your-script-name].js
\`\`\`

> Replace \`\[your-script-name\]\` with the name of your script file.

## 🌟 Features

- **Token Creation**: Introducing "HbarLight" (\`HLTS\`), a fungible token.
- **Smart Contract Deployment**: Deploy Solidity bytecode to Hedera.
- **Token Operations**: Mint, associate, and transfer with ease.

## 📝 Notes

- Ensure your Hedera accounts have enough HBARs for transaction fees.
- **Security**: Always keep private keys confidential!

