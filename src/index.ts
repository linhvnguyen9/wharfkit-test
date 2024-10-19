import { SealedMessage } from '@greymass/anchor-link-session-manager';
import { AES_CBC } from '@greymass/miniaes';
import ContractKit from '@wharfkit/contract';
import {Bytes, KeyType, PrivateKey, PublicKey, ResolvedSigningRequest, UInt64} from '@wharfkit/session'
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
import { Checksum256, Checksum512 } from 'anchor-link';
import dotenv from 'dotenv';
import { auth } from 'google-auth-library';
import zlib from 'zlib';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY as string
const accountName = process.env.ACCOUNT_NAME as string
const permissionName = "owner"
const proposalName = "changeowner1"

const msigPrivateKey = '5K5rHURCeDyUHuviRkTFZM9fH5VQbCMSmPxs147VyzUXqFGCsv6'
const msigAccountName = 'accpartner12'
const msigPermissionName = 'active'
const msigProposalName = 'dxzr2g'

const chain = {
  id: "73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d",
  url: "https://jungle4.greymass.com",
}

const walletPlugin = new WalletPluginPrivateKey(privateKey)

const transactPlugin = new TransactPluginResourceProvider()

@Struct.type('link_create')
export class LinkCreate extends Struct {
    @Struct.field('name') session_name!: Name
    @Struct.field('public_key') request_key!: PublicKey
    @Struct.field('string', {extension: true}) user_agent?: string
}

// @Struct.type('transfer')
// export class Transfer extends Struct {
//     @Struct.field(Name) from!: Name
//     @Struct.field(Name) to!: Name
//     @Struct.field(Asset) quantity!: Asset
//     @Struct.field('string') memo!: string
// }
// const textEncoder = new util.TextEncoder()
// const textDecoder = new util.TextDecoder()

// const rpc = new JsonRpc(chain.url, {
//     fetch // only needed if running in nodejs, not required in browsers
// })

// const eos = new Api({
//     rpc: rpc,
//     textDecoder: textDecoder,
//     textEncoder: textEncoder,
// })


const session = new Session({
  actor: accountName,
  permission: permissionName,
  chain,
  walletPlugin,
}, {
  transactPlugins: [transactPlugin],
})

const mainnetSession = new Session({
  actor: mainnetAccountName,
  permission: mainnetPermissionName,
  chain: mainnetChain,
  mainnetWalletPlugin,
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
  const unapproveTx = {
    account: "eosio",
    name: "powerup",
    authorization: [session.permissionLevel],
    data: {
      payer: 'harkonnenmgl',
      receiver: 'accpartner12',
      days: 1,
      net_frac: 20000000000,
      cpu_frac: 80000000000,
      max_payment: '10.0000 EOS',
    }
  }

  // const ramTransferAction = [{
  //   account: "eosio",
  //   name: "ramtransfer",
  //   authorization: [session.permissionLevel],
  //   data: {
  //     from: accountName,
  //     to: "mangalaprovn",
  //     bytes: 1024,
  //     memo: "Hello World!",
  //   },
  // }, {
  //   account: "eosio",
  //   name: "ramtransfer",
  //   authorization: [session.permissionLevel],
  //   data: {
  //     from: accountName,
  //     to: "yfxzodmw.sus",
  //     bytes: 1024,
  //     memo: "Hello World!",
  //   },
  // }]

  const result = await session.transact({ action: unapproveTx})
  console.log(result)

  // const buyRamBytes = BuyRam

//   const result = await session.transact({ action: transferAction })
//   console.log(result)
//   console.log(`Transaction was successfully broadcast!`)
//   // console.log(
//   //   `Explorer Link: https://jungle4.eosq.eosnation.io/tx/${result.response!!.transaction_id}`
//   // )

//   const client = new APIClient({ url: "https://jungle4.greymass.com" })

//   const contractKit = new ContractKit({
//     client: client,
//   })

//   // From serialized data back to original data
//   const { abi } = await client.v1.chain.get_abi("eosio.token")
//   if (abi) {
//     const data = {
//       signatures: [
//         "SIG_K1_JwKE3VCW1oBBNKWo9fNRc28E5HY68TZ1J9DGsFgbC8yb3pzCKW7hdPnnyt3Nv7Jwx5sCdtVJtGipKUu6sxo7nxGhtB1Li7"
//       ],
//       compression: 0,
//       packed_context_free_data: "",
//       packed_trx: "d01ab36695a38758ccfe000000000100a6823403ea3055000000572d3ccdcd01b0cdcd512f85cc6500000000a8ed323221b0cdcd512f85cc653037bdd544c3a691102700000000000004454f53000000000000"
//     }
//     const packedTransaction = PackedTransaction.from(data)
//     const transaction = packedTransaction.getTransaction()
//     const decoded = transaction.actions[0].decodeData(abi)
//     console.log(Serializer.objectify(decoded));
//   }

//   // Test msig data
//   const msigAbi = await client.v1.chain.get_abi("eosio.msig")
//   if (msigAbi.abi) {
//     const data = "b0cdcd512f85cc6500ae9a9c2a364d4301b0cdcd512f85cc65000000000090b1cab3177d5d000000000000000000000100a6823403ea3055000000572d3ccdcd010100000000000000020000000000000021b0cdcd512f85cc653037bdd544c3a691e80300000000000004454f53000000000000"
//     const decodedMsig = Serializer.decode({data: data, abi: msigAbi.abi, type: "propose"})
//     console.log(Serializer.objectify(decodedMsig));

//     const fullPackedTrx = {
//       signatures: [
//         'SIG_K1_K7pKAQtaycWCemvfQHKKwfsPkCRd9NLKWvypJsA7Hh1CE6hKrgUEqigvjkrQfosSnKZke3KLe3Mkpd1a6f9628RkJ2kQFN'
//       ],
//       compression: 0,
//       packed_context_free_data: '00',
//       packed_trx: 'DD79B366335AB15339BA00000000010000735802EA305500000040615AE9AD0110999C6A4E0AAF6900000000A8ED32327410999C6A4E0AAF6910AE9A9C2A364D430110999C6A4E0AAF6900000000A8ED3232335FE866000000000000000000000100A6823403EA3055000000572D3CCDCD0110999C6A4E0AAF6900000000A8ED32322110999C6A4E0AAF693037BDD544C3A691E80300000000000004454F5300000000000000'
//     }
//     const packedTransaction = PackedTransaction.from(fullPackedTrx)
//     const transaction = packedTransaction.getTransaction()
//     const decoded = transaction.actions[0].decodeData(msigAbi.abi)
//     console.log("Decoded packed multisig transaction")
//     console.log("Expiration " + transaction.expiration);
//     console.log("ref_block_prefix " + transaction.ref_block_prefix);
//     console.log("max_net_usage_words " + transaction.max_net_usage_words);
//     console.log("max_cpu_usage_ms: " + transaction.max_cpu_usage_ms);
//     console.log("delay_sec: " + transaction.delay_sec);
//     console.log("transaction data " + transaction.actions[0].data);
//     console.log(Serializer.objectify(decoded));
//     console.log(Serializer.objectify(decoded).trx.actions[0]);

//     console.log("Primitive serialize: ")
//     console.log("proposer: " + Serializer.encode({object: accountName, type: "name"}));
//     console.log("proposal_name: " + Serializer.encode({object: proposalName, type: "name"}));
//     // console.log("requested: " + Serializer.encode({object: [{
//     //   actor: accountName,
//     //   permission: permissionName,
//     // }], type: Requested}));
//   }

//   // From data to serialized data
//   const coreContract = await contractKit.load("eosio")
//   const msigContract = await contractKit.load("eosio.msig")
//   const tokenContract = await contractKit.load("eosio.token")

//   const sendObj = Transfer.from ({
//     from: accountName,
//     to: "mangalaprovn",
//     quantity: "0.1000 EOS",
//     memo: "",
//   })
//   const sendAction = tokenContract.action("transfer", sendObj, { authorization: [session.permissionLevel] })
//   const infoFirst = await client.v1.chain.get_info()
//   const headerFirst = infoFirst.getTransactionHeader()
//   const transactionHeader = TransactionHeader.from({
//     expiration: '2024-09-16T16:39:15',
//     ref_block_num: 0,
//     ref_block_prefix: 0,
//     max_net_usage_words: 0,
//     max_cpu_usage_ms: 0,
//       delay_sec: 0,
//   })
//   const transactionFirst = Transaction.from({
//     ...transactionHeader,
//     actions: [sendAction],
//   })
//   console.log("First transaction data " + transactionFirst.actions[0].authorization);
  
//   // This was the correct transaction
//   // const transactionFirst = Transaction.from({
//   //   ...transactionHeader,
//   //   actions: [{
//   //     account: 'eosio.token',
//   //     name: 'transfer',
//   //     authorization: [ {
//   //       actor: 'harkonnenmgl',
//   //       permission: 'active',
//   //     } ],
//   //     data: '10999C6A4E0AAF693037BDD544C3A691E80300000000000004454F530000000000'
//   //   }],
//   // })
//   const proposeObj = {
//     proposal_name: 'changeowner1',
//     proposer: accountName,
//     requested: [
//       {
//         actor: accountName,
//         permission: permissionName,
//       }
//     ],
//     trx: transactionFirst
//   }
//   // const proposeAction = msigContract.action("propose", proposeObj, { authorization: [session.permissionLevel] })
//   // console.log("Send action data " + sendAction.data)
//   // console.log("Propose action" + Serializer.objectify(proposeAction))
//   // console.log("Propose action data " + proposeAction.data)

//   const info = await client.v1.chain.get_info()
//   // const header = info.getTransactionHeader()
//   // const transaction = Transaction.from({
//   //   ...header,
//   //   actions: [proposeAction],
//   // })
//   // const signature = await session.signTransaction(transaction)
//   // const signedTransaction = SignedTransaction.from({
//   //   ...transaction,
//   //   signatures: signature,
//   // })
//   // const packedTransaction = PackedTransaction.fromSigned(signedTransaction, CompressionType.none)
//   // console.log(Serializer.objectify(packedTransaction))
//   // const actualTransaction = await session.transact(transaction)
//   // console.log("Actual transaction")
//   // console.log(actualTransaction)

//   // const textEncoder = new util.TextEncoder()
//   // const textDecoder = new util.TextDecoder()

//   const opts = {
//     // string encoder
//     // textEncoder,
//     // string decoder
//     // textDecoder,
//     // zlib string compression (optional, recommended)
//     zlib: {
//         deflateRaw: (data: Uint8Array) => new Uint8Array(zlib.deflateRawSync(Buffer.from(data))),
//         inflateRaw: (data: Uint8Array) => new Uint8Array(zlib.inflateRawSync(Buffer.from(data))),
//     },
//     // Customizable ABI Provider used to retrieve contract data
//     // abiProvider: {
//     //     getAbi: async (account:any) => (await eos.getAbi(account))
//     // }
//   }
//   // const uri = 'esr:g2MsfmIRpc7x7DpLh8nvg-zz9VdvrLYRihbJ-mIxXW5CYY4vMwMDwxVGnkwbBibrjJKSgmIrff3kJL3EvOSM_CK9nMy8bP3ERMtEi6S0NN2kpDQzXRMLcwvdpJREU13jlOREAzNDIzPDNEsmFpDSk4wI0652rNtg3BckNyvZ66z7Z-FvbWYHC3vPcocdn6a2-d2HFZpzGR3BdviArDDWM9MzUHAqyi8vTi0KKUrMKy7ILyqBCvvmV2Xm5CTqmwLZGr6JyZl5JfnFGdYKnnklqTkKQAEF_2CFCAVDg3hD03hzTQXHgoKc1PDUJO_MEn1TY3M9YzMFDW-PEF8fHYWczOxUBffU5Ox8TQXnjKL83FR9QyMLPQMQVAhOTEssyoRqYS1Ozi9I5UjKyc8u1svMBwA'
//   // const decoded = SigningRequest.from(uri, opts)

// //   // In order to resolve the transaction, we need a recent block
// //   const head = info.head_block_num;
// //   const block = await client.v1.chain.get_block(head);
// // const abis = await decoded.fetchAbis();

//   // An authorization to resolve the transaction to
//   // const authorization = {
//   //   actor: 'harkonnenmgl',
//   //   permission: 'active',
//   // }

//   // const resolved = await decoded.resolve(abis, authorization, block);

//   // console.log("Decoded ESR " + decoded)
//   // console.log("Decoded ESR " + decoded.data.flags.background)

//   // const decodedLinkData = Serializer.decode({
//   //   data: decoded.data.info[0].value,
//   //   type: LinkCreate,
//   // })
//   // console.log("Decoded link data " + decodedLinkData)

//   // const anchorLinkData = Bytes.fromString('0003ed00b1b71e196c1fc28a2bc5c1e5b9ef5d611742343039a42431605bcc993aad17b6ff79a0da7195d001b509d06591c7ca6895b6b074eb5dfeafbe40de31a1a05ec59dc74a541fac1a2c939418d64cd5a916c4ac53e8141d4a369195e95e04a9d7d543e7d6d9f557183b078eab343abc789bf375a28484360a160620b7f863a9cafcb904d2e8dc4dc6896cac3dc811c388b060aada79761cc62b7381910df69d96b0dbccddd8e404c0bd0932c4e676314c9d510f1bddaa4ed6829fe72c5a944cf05ff39a9d8bcb53819dd96a724de0a1b45cc4b8e9b13de3049656409e7f5cc98832df6f48e5f3fc5f71c2697abbd082ee42e1fbdb77fd76f65227f336b6', 'hex')
//   // const receivePrivateKey = PrivateKey.fromString('5HxGAg2NHHYFVzFnjzr3qJ7qzSUR8UJkePp2WzvoruC1rsBC9mu')
//   // const requestPublicKey = new PublicKey(KeyType.K1, Bytes.fromString('03ed00b1b71e196c1fc28a2bc5c1e5b9ef5d611742343039a42431605bcc993aad', 'hex')) // 'PUB_K1_8dcSqNjVX2qoCMPPhmBncV8j2z1ysySyTCZqVzAbUPxFY69q7w'
//   // const nonce = UInt64.from('10768628566795990551')

//   // const sealResult = sealMessage(
//   //   "Hello World!",
//   //   receivePrivateKey,
//   //   requestPublicKey,
//   //   nonce
//   // )

//   // console.log(sealResult)

//   // const unsealResult = unsealMessage(
//   //   anchorLinkData,
//   //   receivePrivateKey,
//   //   requestPublicKey,
//   //   nonce
//   // )
//   // console.log(unsealResult)

//   // const k1 = PrivateKey.from('5KGNiwTYdDWVBc9RCC28hsi7tqHGUsikn9Gs8Yii93fXbkYzxGi')
//   // const k2 = PrivateKey.from('5Kik3tbLSn24ScHFsj6GwLkgd1H4Wecxkzt1VX7PBBRDQUCdGFa')
//   // const sealed = sealMessage(
//   //     'The hovercraft is full of eels',
//   //     k1,
//   //     k2.toPublic(),
//   //     UInt64.from(42)
//   // )
//   // console.log(sealed.ciphertext.hexString)
//   // console.log(sealed.checksum.toString())

//   // const unsealed = unsealMessage(
//   //     sealed.ciphertext,
//   //     k2,
//   //     k1.toPublic(),
//   //     sealed.nonce
//   // )
//   // console.log(unsealed)

//   // console.log("Resolved ESR " + resolved)

  
})();

function sealMessage(
  message: string,
  privateKey: PrivateKey,
  publicKey: PublicKey,
  nonce?: UInt64
): SealedMessage {
  const secret = privateKey.sharedSecret(publicKey)
  if (!nonce) {
      nonce = UInt64.random()
  }
  const key = Checksum512.hash(Serializer.encode({object: nonce}).appending(secret.array))
  const cbc = new AES_CBC(key.array.slice(0, 32), key.array.slice(32, 48))
  const ciphertext = Bytes.from(cbc.encrypt(Bytes.from(message, 'utf8').array))
  const checksumView = new DataView(Checksum256.hash(key.array).array.buffer)
  const checksum = checksumView.getUint32(0, true)
  return SealedMessage.from({
      from: privateKey.toPublic(),
      nonce,
      ciphertext,
      checksum,
  })
}

function unsealMessage(
  message: Bytes,
  privateKey: PrivateKey,
  publicKey: PublicKey,
  nonce: UInt64
): string {
  const secret = privateKey.sharedSecret(publicKey)
  const encodedNonce = Serializer.encode({object: nonce})
  const dataBeforeHash = encodedNonce.appending(secret.array)
  const key = Checksum512.hash(dataBeforeHash)
  const cbc = new AES_CBC(key.array.slice(0, 32), key.array.slice(32, 48))
  const ciphertext = Bytes.from(cbc.decrypt(message.array))
  return ciphertext.toString('utf8')
}

// function unsealMessage(
//   message: string,
//   privateKey: PrivateKey,
//   publicKey: PublicKey,
//   nonce?: UInt64
// ): SealedMessage {
//   const secret = privateKey.sharedSecret(publicKey)
//   if (!nonce) {
//       nonce = UInt64.random()
//   }
//   const key = Checksum512.hash(Serializer.encode({object: nonce}).appending(secret.array))
//   const cbc = new AES_CBC(key.array.slice(0, 32), key.array.slice(32, 48))
//   const ciphertext = Bytes.from(cbc.encrypt(Bytes.from(message, 'utf8').array))
//   const checksumView = new DataView(Checksum256.hash(key.array).array.buffer)
//   const checksum = checksumView.getUint32(0, true)
//   return SealedMessage.from({
//       from: privateKey.toPublic(),
//       nonce,
//       ciphertext,
//       checksum,
//   })
// }

// interface SigningRequestEncodingOptions {
//     /** Optional zlib, if provided the request will be compressed when encoding. */
//     zlib?: ZlibProvider;
//     /** Abi provider, required if the arguments contain un-encoded actions. */
//     abiProvider?: AbiProvider;
//     /** Optional signature provider, will be used to create a request signature if provided. */
//     signatureProvider?: SignatureProvider;
// }