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
} from '@wharfkit/session'
import { TransactPluginResourceProvider } from "@wharfkit/transact-plugin-resource-provider";
import { WalletPluginPrivateKey } from "@wharfkit/wallet-plugin-privatekey";
import { sign } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY as string
const accountName = process.env.ACCOUNT_NAME as string

const chain = {
  id: "73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d",
  url: "https://jungle4.greymass.com",
}

const permissionName = "active"

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
        'SIG_K1_KVSopXV6cANB1yMmgj46PBo1SujoZHpW2vjc8u7nxzz1Dxu4CoqxBurqC8yA4KaGR6aXcbdRq2E9YuqLyCdzAWn5k3HDAM'
      ],
      compression: 0,
      packed_context_free_data: '00',
      packed_trx: '154bb36650ff6f50e0ce00000000010000735802ea305500000040615ae9ad010100000000000000020000000000000074b0cdcd512f85cc6500ae9a9c2a364d4301b0cdcd512f85cc65000000000090b1ca134bb36650ff6f50e0ce000000000100a6823403ea3055000000572d3ccdcd010100000000000000020000000000000021b0cdcd512f85cc653037bdd544c3a691e80300000000000004454f5300000000000000'
    }
    const packedTransaction = PackedTransaction.from(fullPackedTrx)
    const transaction = packedTransaction.getTransaction()
    const decoded = transaction.actions[0].decodeData(msigAbi.abi)
    console.log("Decoded packed multisig transaction")
    console.log(Serializer.objectify(decoded));
    console.log(Serializer.objectify(decoded).trx.actions[0]);
    console.log(Serializer.objectify(decoded).trx.actions[0].authorization[0].actor.toString());
  }

  // From data to serialized data
  const msigContract = await contractKit.load("eosio.msig")
  const tokenContract = await contractKit.load("eosio.token")
  const sendObj = Transfer.from ({
    from: accountName,
    to: "mangalaprovn",
    quantity: "0.1000 EOS",
    memo: "",
  })
  const sendAction = tokenContract.action("transfer", sendObj)
  const infoFirst = await client.v1.chain.get_info()
  const headerFirst = infoFirst.getTransactionHeader()
  const transactionFirst = Transaction.from({
    ...headerFirst,
    actions: [sendAction],
  })
  const proposeObj = {
    proposer: accountName,
    proposal_name: 'kdiespxdwas1',
    requested: [
      {
        actor: accountName,
        permission: permissionName,
      }
    ],
    trx: transactionFirst
  }
  const proposeAction = msigContract.action("propose", proposeObj)
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
