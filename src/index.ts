import ContractKit from '@wharfkit/contract';
import {
  ABI,
  AbstractTransactPlugin,
  Action,
  APIClient,
  Asset,
  AssetType,
  Cancelable,
  Canceled,
  ChainDefinition,
  CompressionType,
  Name,
  PackedTransaction,
  PermissionLevel,
  PromptResponse,
  Serializer,
  Session,
  Signature,
  SignedTransaction,
  SigningRequest,
  SigningRequestCreateArguments,
  Struct,
  TransactContext,
  TransactHookResponse,
  TransactHookTypes,
  Transaction,
  TransactionHeader,
} from '@wharfkit/session'
import { TransactPluginResourceProvider } from "@wharfkit/transact-plugin-resource-provider";
import { WalletPluginPrivateKey } from "@wharfkit/wallet-plugin-privatekey";
import { sign } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY as string
const accountName = process.env.ACCOUNT_NAME as string
const permissionName = "active"
const proposalName = "changeowner1"

const chain = {
  id: "73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d",
  url: "https://jungle4.greymass.com",
}

const walletPlugin = new WalletPluginPrivateKey(privateKey)

const transactPlugin = new TransactPluginResourceProvider()

// @Struct.type('transfer')
// export class Transfer extends Struct {
//     @Struct.field(Name) from!: Name
//     @Struct.field(Name) to!: Name
//     @Struct.field(Asset) quantity!: Asset
//     @Struct.field('string') memo!: string
// }

const session = new Session({
  actor: accountName,
  permission: permissionName,
  chain,
  walletPlugin,
}, {
  transactPlugins: [transactPlugin],
})

const transferAction = {
  account: "eosio.token",
  name: "transfer",
  authorization: [session.permissionLevel],
  data: {
    from: session.actor,
    to: "wharfkittest",
    quantity: "0.0001 EOS",
    memo: "Hello World!",
  },
}


@Struct.type('transfer')
export class Transfer extends Struct {
    @Struct.field(Name) from!: Name
    @Struct.field(Name) to!: Name
    @Struct.field(Asset) quantity!: Asset
    @Struct.field('string') memo!: string
}

@Struct.type("propose")
class Propose extends Struct {
  @Struct.field("name") proposer!: Name
  @Struct.field("name") proposal_name!: Name
  @Struct.field(PermissionLevel, {array: true}) requested!: PermissionLevel
  @Struct.field("transaction") trx!: Transaction
}

@Struct.type("requested")
class Requested extends Struct {
  @Struct.field(PermissionLevel, {array: true}) requested!: PermissionLevel
}

// console.log(transactPlugin);

(async () => {
  // const result = await session.transact({ action: transferAction })
  // console.log(`Transaction was successfully broadcast!`)
  // console.log(
  //   `Explorer Link: https://jungle4.eosq.eosnation.io/tx/${result.response!!.transaction_id}`
  // )

  const client = new APIClient({ url: "https://jungle4.greymass.com" })

  const contractKit = new ContractKit({
    client: client,
  })

  // From serialized data back to original data
  const { abi } = await client.v1.chain.get_abi("eosio.token")
  if (abi) {
    const data = {
      signatures: [
        "SIG_K1_JwKE3VCW1oBBNKWo9fNRc28E5HY68TZ1J9DGsFgbC8yb3pzCKW7hdPnnyt3Nv7Jwx5sCdtVJtGipKUu6sxo7nxGhtB1Li7"
      ],
      compression: 0,
      packed_context_free_data: "",
      packed_trx: "d01ab36695a38758ccfe000000000100a6823403ea3055000000572d3ccdcd01b0cdcd512f85cc6500000000a8ed323221b0cdcd512f85cc653037bdd544c3a691102700000000000004454f53000000000000"
    }
    const packedTransaction = PackedTransaction.from(data)
    const transaction = packedTransaction.getTransaction()
    const decoded = transaction.actions[0].decodeData(abi)
    console.log(Serializer.objectify(decoded));
  }

  // Test msig data
  const msigAbi = await client.v1.chain.get_abi("eosio.msig")
  if (msigAbi.abi) {
    const data = "b0cdcd512f85cc6500ae9a9c2a364d4301b0cdcd512f85cc65000000000090b1cab3177d5d000000000000000000000100a6823403ea3055000000572d3ccdcd010100000000000000020000000000000021b0cdcd512f85cc653037bdd544c3a691e80300000000000004454f53000000000000"
    const decodedMsig = Serializer.decode({data: data, abi: msigAbi.abi, type: "propose"})
    console.log(Serializer.objectify(decodedMsig));

    const fullPackedTrx = {
      signatures: [
        'SIG_K1_K7pKAQtaycWCemvfQHKKwfsPkCRd9NLKWvypJsA7Hh1CE6hKrgUEqigvjkrQfosSnKZke3KLe3Mkpd1a6f9628RkJ2kQFN'
      ],
      compression: 0,
      packed_context_free_data: '00',
      packed_trx: 'DD79B366335AB15339BA00000000010000735802EA305500000040615AE9AD0110999C6A4E0AAF6900000000A8ED32327410999C6A4E0AAF6910AE9A9C2A364D430110999C6A4E0AAF6900000000A8ED3232335FE866000000000000000000000100A6823403EA3055000000572D3CCDCD0110999C6A4E0AAF6900000000A8ED32322110999C6A4E0AAF693037BDD544C3A691E80300000000000004454F5300000000000000'
    }
    const packedTransaction = PackedTransaction.from(fullPackedTrx)
    const transaction = packedTransaction.getTransaction()
    const decoded = transaction.actions[0].decodeData(msigAbi.abi)
    console.log("Decoded packed multisig transaction")
    console.log("Expiration " + transaction.expiration);
    console.log("ref_block_prefix " + transaction.ref_block_prefix);
    console.log("max_net_usage_words " + transaction.max_net_usage_words);
    console.log("max_cpu_usage_ms: " + transaction.max_cpu_usage_ms);
    console.log("delay_sec: " + transaction.delay_sec);
    console.log("transaction data " + transaction.actions[0].data);
    console.log(Serializer.objectify(decoded));
    console.log(Serializer.objectify(decoded).trx.actions[0]);

    console.log("Primitive serialize: ")
    console.log("proposer: " + Serializer.encode({object: accountName, type: "name"}));
    console.log("proposal_name: " + Serializer.encode({object: proposalName, type: "name"}));
    console.log("requested: " + Serializer.encode({object: [{
      actor: accountName,
      permission: permissionName,
    }], type: Requested}));
  }

  // From data to serialized data
  const coreContract = await contractKit.load("eosio")
  const msigContract = await contractKit.load("eosio.msig")
  const tokenContract = await contractKit.load("eosio.token")

  const sendObj = Transfer.from ({
    from: accountName,
    to: "mangalaprovn",
    quantity: "0.1000 EOS",
    memo: "",
  })
  const sendAction = tokenContract.action("transfer", sendObj, { authorization: [session.permissionLevel] })
  const infoFirst = await client.v1.chain.get_info()
  const headerFirst = infoFirst.getTransactionHeader()
  const transactionHeader = TransactionHeader.from({
    expiration: '2024-09-16T16:39:15',
    ref_block_num: 0,
    ref_block_prefix: 0,
    max_net_usage_words: 0,
    max_cpu_usage_ms: 0,
      delay_sec: 0,
  })
  const transactionFirst = Transaction.from({
    ...transactionHeader,
    actions: [sendAction],
  })
  console.log("First transaction data " + transactionFirst.actions[0].authorization);
  
  // This was the correct transaction
  // const transactionFirst = Transaction.from({
  //   ...transactionHeader,
  //   actions: [{
  //     account: 'eosio.token',
  //     name: 'transfer',
  //     authorization: [ {
  //       actor: 'harkonnenmgl',
  //       permission: 'active',
  //     } ],
  //     data: '10999C6A4E0AAF693037BDD544C3A691E80300000000000004454F530000000000'
  //   }],
  // })
  const proposeObj = {
    proposal_name: 'changeowner1',
    proposer: accountName,
    requested: [
      {
        actor: accountName,
        permission: permissionName,
      }
    ],
    trx: transactionFirst
  }
  const proposeAction = msigContract.action("propose", proposeObj, { authorization: [session.permissionLevel] })
  console.log("Send action data " + sendAction.data)
  console.log("Propose action" + Serializer.objectify(proposeAction))
  console.log("Propose action data " + proposeAction.data)

  const info = await client.v1.chain.get_info()
  const header = info.getTransactionHeader()
  const transaction = Transaction.from({
    ...header,
    actions: [proposeAction],
  })
  const signature = await session.signTransaction(transaction)
  const signedTransaction = SignedTransaction.from({
    ...transaction,
    signatures: signature,
  })
  const packedTransaction = PackedTransaction.fromSigned(signedTransaction, CompressionType.none)
  console.log(Serializer.objectify(packedTransaction))
  const actualTransaction = await session.transact(transaction)
  console.log("Actual transaction")
  console.log(actualTransaction)
})();
