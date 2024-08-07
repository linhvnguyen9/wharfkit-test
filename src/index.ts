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
  Name,
  PackedTransaction,
  PermissionLevel,
  PromptResponse,
  Serializer,
  Session,
  Signature,
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
import dotenv from 'dotenv';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY as string
const accountName = process.env.ACCOUNT_NAME as string

const chain = {
  id: "73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d",
  url: "https://jungle4.greymass.com",
}

const permissionName = "test"

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

class Transfer extends Struct {
  static abiName = "transfer"
  static abiFields = [
    {
      name: "from",
      type: Name,
    },
    {
      name: "to",
      type: Name,
    },
    {
      name: "quantity",
      type: Asset,
    },
    {
      name: "memo",
      type: "string",
    },
  ]
}

@Struct.type("propose")
class Propose extends Struct {
  @Struct.field("name") proposer!: Name
  @Struct.field("name") proposal_name!: Name
  @Struct.field(PermissionLevel, {array: true}) requested!: PermissionLevel
  @Struct.field("transaction") trx!: Transaction
}

console.log(transactPlugin);

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
  // const msigAbi = await client.v1.chain.get_abi("eosio.msig")
  // if (msigAbi.abi) {
  //   const data = "23231"
  //   Serializer.decode({data: data, abi: msigAbi.abi, type: "propose"})
  // }

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
  // const proposeObj = Propose.from({
    
  // })
  const proposeAction = msigContract.action("propose", {
    proposer: accountName,
    proposal_name: 'changeowner',
    requested: [
      {
        actor: accountName,
        permission: permissionName,
      }
    ],
    trx: {
      expiration: '2019-09-14T16:39:15',
      ref_block_num: 0,
      ref_block_prefix: 0,
      max_net_usage_words: 0,
      max_cpu_usage_ms: 0,
      delay_sec: 0,
      context_free_actions: [],
      actions: [sendAction],
      transaction_extensions: []
    }
  })
  console.log("Send action data " + sendAction.data)
  console.log("Propose action data " + proposeAction.data)
})();
