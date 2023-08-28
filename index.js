const {
  Client,
  Hbar,
  TokenCreateTransaction,
  AccountId,
  PrivateKey,
  TokenInfoQuery,
  AccountBalanceQuery,
  FileCreateTransaction,
  FileAppendTransaction,
  TokenUpdateTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  ContractExecuteTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");

require("dotenv").config();

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
const olfaId = AccountId.fromString("0.0.1080216");
const olfaKey = PrivateKey.fromString(process.env.OLFA_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);
//client.setMaxTransactionFee(new Hbar(0.75));
client.setMaxQueryPayment(new Hbar(0.01));

async function main() {
  // STEP 1 ===================================
  console.log(`STEP 1 ===================================`);
  const bytecode = fs.readFileSync(
    "./MintAssociateTransferHTS_sol_MintAssoTransHTS.bin"
  );

  console.log(`- Done \n`);

  // STEP 2 ===================================
  // Create a fungible token
  console.log(`STEP 2 ===================================`);
  const tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName("HbarLight")
    .setTokenSymbol("HLTS")
    .setDecimals(0)
    .setInitialSupply(1000)
    .setTreasuryAccountId(treasuryId)
    .setAdminKey(treasuryKey)
    .setSupplyKey(treasuryKey)
    .freezeWith(client)
    .sign(treasuryKey);

  const tokenCreateSubmitTx = await tokenCreateTx.execute(client);
  const tokenCreateReciept = await tokenCreateSubmitTx.getReceipt(client);
  const tokenId = tokenCreateReciept.tokenId;
  const tokenAddressSol = tokenId.toSolidityAddress();
  console.log(`- Token ID: ${tokenId}`);
  console.log(`- Token ID in Solidity format: ${tokenAddressSol}`);

  // Token query
  const tokenInfo1 = await tQueryFcn(tokenId);
  console.log(`- Initial token supply: ${tokenInfo1.totalSupply.low} \n`);

  //Create a file on Hedera and store the contract bytecode
  const fileCreateTx = new FileCreateTransaction()
    .setKeys([treasuryKey])
    .freezeWith(client);
  const fileCreateSign = await fileCreateTx.sign(treasuryKey);
  const fileCreateSubmit = await fileCreateSign.execute(client);
  const fileCreateRx = await fileCreateSubmit.getReceipt(client);
  const bytecodeFileId = fileCreateRx.fileId;
  console.log(`- The smart contract bytecode file ID is ${bytecodeFileId}`);

  // Append contents to the file
  const fileAppendTx = new FileAppendTransaction()
    .setFileId(bytecodeFileId)
    .setContents(bytecode)
    .setMaxChunks(10)
    .freezeWith(client);
  const fileAppendSign = await fileAppendTx.sign(treasuryKey);
  const fileAppendSubmit = await fileAppendSign.execute(client);
  const fileAppendRx = await fileAppendSubmit.getReceipt(client);
  console.log(`- Content added: ${fileAppendRx.status} \n`);

  // STEP 3 ===================================
  console.log(`STEP 3 ===================================`);
  // Create the smart contract
  const contractInstantiateTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(3000000)
    .setConstructorParameters(
      new ContractFunctionParameters().addAddress(tokenAddressSol)
    );
  const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
  const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(
    client
  );
  const contractId = contractInstantiateRx.contractId;
  const contractAddress = contractId.toSolidityAddress();
  console.log(`- The smart contract ID is: ${contractId}`);
  console.log(
    `- The smart contract ID in Solidity format is: ${contractAddress} \n`
  );

  // Token query 2.1
  const tokenInfo2p1 = await tQueryFcn(tokenId);
  console.log(`- Token supply key: ${tokenInfo2p1.supplyKey.toString()}`);

  // Update the fungible so the smart contract manages the supply
  const tokenUpdateTx = await new TokenUpdateTransaction()
    .setTokenId(tokenId)
    .setSupplyKey(contractId)
    .freezeWith(client)
    .sign(treasuryKey);
  const tokenUpdateSubmit = await tokenUpdateTx.execute(client);
  const tokenUpdateRx = await tokenUpdateSubmit.getReceipt(client);
  console.log(`- Token update status: ${tokenUpdateRx.status}`);

  // Token query 2.2
  const tokenInfo2p2 = await tQueryFcn(tokenId);
  console.log(`- Token supply key: ${tokenInfo2p2.supplyKey.toString()} \n`);

  // STEP 4 ===================================
  console.log(`STEP 4 ===================================`);
  //Execute a contract function (mint)
  const contractExecTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "mintFungibleToken",
      new ContractFunctionParameters().addUint64(150)
    );
  const contractExecSubmit = await contractExecTx.execute(client);
  const contractExecRx = await contractExecSubmit.getReceipt(client);
  console.log(`- New tokens minted: ${contractExecRx.status.toString()}`);

  // Token query 3
  const tokenInfo3 = await tQueryFcn(tokenId);
  console.log(`- New token supply: ${tokenInfo3.totalSupply.low} \n`);

  //Execute a contract function (associate)
  const contractExecTx1 = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(4000000)
    .setFunction(
      "tokenAssociate",
      new ContractFunctionParameters().addAddress(olfaId.toSolidityAddress())
    )
    .freezeWith(client);
  const contractExecSign1 = await contractExecTx1.sign(olfaKey);
  const contractExecSubmit1 = await contractExecSign1.execute(client);
  const contractExecRx1 = await contractExecSubmit1.getReceipt(client);
  console.log(
    `- Token association with Olfa's account: ${contractExecRx1.status.toString()} \n`
  );

  //Execute a contract function (transfer)
  const contractExecTx2 = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "tokenTransfer",
      new ContractFunctionParameters()
        .addAddress(treasuryId.toSolidityAddress())
        .addAddress(olfaId.toSolidityAddress())
        .addInt64(50)
    )
    .freezeWith(client);
  const contractExecSign2 = await contractExecTx2.sign(treasuryKey);
  const contractExecSubmit2 = await contractExecSign2.execute(client);
  const contractExecRx2 = await contractExecSubmit2.getReceipt(client);

  console.log(
    `- Token transfer from Treasury to Alice: ${contractExecRx2.status.toString()}`
  );

  const tB = await bCheckerFcn(treasuryId);
  const aB = await bCheckerFcn(olfaId);
  console.log(`- Treasury balance: ${tB} units of token ${tokenId}`);
  console.log(`- Alice balance: ${aB} units of token ${tokenId} \n`);

  // ========================================
  // FUNCTIONS
  async function tQueryFcn(tId) {
    let info = await new TokenInfoQuery().setTokenId(tId).execute(client);
    return info;
  }

  async function bCheckerFcn(aId) {
    let balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(aId)
      .execute(client);
    return balanceCheckTx.tokens._map.get(tokenId.toString());
  }
}

main();
