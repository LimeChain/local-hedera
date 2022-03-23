// import {
//     AccountCreateTransaction,
//     Client,
//     Hbar,
//     PublicKey as HederaPubKey
// } from "@hashgraph/sdk";
//
// import * as hethers from '@hashgraph/hethers';
//
// async function bootstrap() {
//     const client = Client.forNetwork({
//         '127.0.0.1:50211': '0.0.3'
//     }).setOperator('0.0.2', '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137');
//
//     for (let i = 0; i < 5; i++) {
//         const randomWallet = hethers.Wallet.createRandom();
//         const tx = await new AccountCreateTransaction()
//             .setKey(HederaPubKey.fromString(randomWallet._signingKey().compressedPublicKey))
//             .setInitialBalance(Hbar.fromTinybars(100000000000))
//             .execute(client);
//         const getReceipt = await tx.getReceipt(client);
//         // @ts-ignore
//         console.log(getReceipt.accountId.toString());
//         console.log(randomWallet._signingKey().privateKey);
//     }
// }
// /
//
// export {
//     bootstrap
// };