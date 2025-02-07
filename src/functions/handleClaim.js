import zkpInit from "@vulpemventures/secp256k1-zkp";
// import axios from "axios";
import { Transaction, address, crypto } from "liquidjs-lib";
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  detectSwap,
  targetFee,
} from "boltz-core";
import {
  TaprootUtils,
  constructClaimTransaction,
  init,
} from "boltz-core/dist/lib/liquid";
import { randomBytes } from "crypto";
import { ECPairFactory } from "ecpair";
import * as ecc from "@bitcoinerlab/secp256k1";
import { getNetwork } from "./network";
import { getBoltzApiUrl, getBoltzWsUrl } from "./boltz";

// import { ClaimInfo, removeClaim, saveClaim } from "./claims";
import getBoltzFeeRates from "./boltzFeeRate";
import fetchFunction from "./fetchFunction";
import { PAYMENT_DESCRIPTION } from "../constants";

/**
 * Reverse swap flow:
 * 1. user generates preimage and sends hash to boltz
 * 2. user generates public key and sends to boltz
 * 3. user receives lightning invoice
 * 4. user validates lightining invoice
 */

export const waitAndClaim = async (
  claimInfo,
  onFinish,
  setBoltzLoadingAnimation
) => {
  init(await zkpInit());
  let claimTx;
  const network = getNetwork(process.env.REACT_APP_ENVIRONMENT);
  const { createdResponse, destinationAddress, keys, preimage } = claimInfo;

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new WebSocket(
    getBoltzWsUrl(process.env.REACT_APP_ENVIRONMENT)
  );
  webSocket.onopen = () => {
    webSocket.send(
      JSON.stringify({
        op: "subscribe",
        channel: "swap.update",
        args: [createdResponse.id],
      })
    );
  };

  webSocket.onmessage = async (rawMsg) => {
    const msg = JSON.parse(rawMsg.data);
    console.log("msg", msg);

    if (msg.event !== "update") return;

    if (msg.args[0].id !== createdResponse.id) return;

    if (msg.args[0].error) {
      webSocket.close();
      onFinish(false);
      return;
    }

    switch (msg.args[0].status) {
      // "swap.created" means Boltz is waiting for the invoice to be paid
      case "swap.created": {
        console.log("Waiting for invoice to be paid");
        break;
      }

      // Boltz's lockup transaction is found in the mempool (or already confirmed)
      // which will only happen after the user paid the Lightning hold invoice
      case "transaction.mempool":
      case "transaction.confirmed": {
        setBoltzLoadingAnimation("Processing payment");
        try {
          // save claim to be able to retry if something fails
          claimInfo.lastStatus = msg.args[0].status;
          // saveClaim(claimInfo, process.env.REACT_APP_ENVIRONMENT);

          const boltzPublicKey = Buffer.from(
            createdResponse.refundPublicKey,
            "hex"
          );
          // const boltzPublicKey = Buffer.from('4444', 'hex')

          // Create a musig signing session and tweak it with the Taptree of the swap scripts
          const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
            boltzPublicKey,
            keys.publicKey,
          ]);
          const tweakedKey = TaprootUtils.tweakMusig(
            musig,
            SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree)
              .tree
          );

          // Parse the lockup transaction and find the output relevant for the swap
          const lockupTx = Transaction.fromHex(msg.args[0].transaction.hex);
          console.log(`Got lockup transaction: ${lockupTx.getId()}`);

          const swapOutput = detectSwap(tweakedKey, lockupTx);
          if (swapOutput === undefined) {
            console.error("No swap output found in lockup transaction");
            return;
          }

          console.log("Creating claim transaction");

          // Create a claim transaction to be signed cooperatively via a key path spend
          const feeRate = await getBoltzFeeRates();

          claimTx = targetFee(feeRate, (fee) =>
            constructClaimTransaction(
              [
                {
                  ...swapOutput,
                  keys,
                  preimage,
                  cooperative: true,
                  type: OutputType.Taproot,
                  txHash: lockupTx.getHash(),
                  blindingPrivateKey: Buffer.from(
                    createdResponse.blindingKey,
                    "hex"
                  ),
                },
              ],
              address.toOutputScript(destinationAddress, network),
              fee,
              true,
              network,
              address.fromConfidential(destinationAddress).blindingKey
            )
          );

          console.log("Getting partial signature from Boltz");
          const boltzSig = await fetchFunction(
            `${getBoltzApiUrl(
              process.env.REACT_APP_ENVIRONMENT
            )}/v2/swap/reverse/${createdResponse.id}/claim`,
            {
              index: 0,
              transaction: claimTx.toHex(),
              preimage: preimage.toString("hex"),
              pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
            },
            "post"
          );

          // Aggregate the nonces
          musig.aggregateNonces([
            [boltzPublicKey, Buffer.from(boltzSig.pubNonce, "hex")],
          ]);

          // Initialize the session to sign the claim transaction
          musig.initializeSession(
            claimTx.hashForWitnessV1(
              0,
              [swapOutput.script],
              [{ asset: swapOutput.asset, value: swapOutput.value }],
              Transaction.SIGHASH_DEFAULT,
              network.genesisBlockHash
            )
          );

          // Add the partial signature from Boltz

          musig.addPartial(
            boltzPublicKey,
            Buffer.from(boltzSig.partialSignature, "hex")
          );

          // Create our partial signature
          musig.signPartial();

          // Witness of the input to the aggregated signature
          claimTx.ins[0].witness = [musig.aggregatePartials()];

          // save claimtx hex on claimInfo
          claimInfo.claimTx = claimTx.toHex();
          // saveClaim(claimInfo, process.env.REACT_APP_ENVIRONMENT);

          console.log("Broadcasting claim transaction");

          const didBroadcast = fetchFunction(
            `${getBoltzApiUrl(
              process.env.REACT_APP_ENVIRONMENT
            )}/v2/chain/L-BTC/transaction`,
            {
              hex: claimTx.toHex(),
            },
            "post"
          );

          if (!didBroadcast) throw Error("did not broadcast");

          claimInfo.claimed = true;
          // removeClaim(claimInfo, process.env.REACT_APP_ENVIRONMENT);
          onFinish(true);
          break;
        } catch (err) {
          console.log(`Error when constructing claim tx: ${err}`);
        }
      }

      case "invoice.settled": {
        console.log("Invoice was settled");
        claimInfo.lastStatus = msg.args[0].status;
        // if (!claimInfo.claimed) saveClaim(claimInfo, process.env.REACT_APP_ENVIRONMENT);
        webSocket.close();
        break;
      }

      case "invoice.expired":
      case "swap.expired":
      case "transaction.failed":
      case "transaction.refunded": {
        console.log(
          `Removing claim, swap status = ${msg.args[0].status}`,
          claimInfo
        );
        // removeClaim(claimInfo, process.env.REACT_APP_ENVIRONMENT);
        webSocket.close();
        break;
      }
    }
  };
};

export const reverseSwap = async (
  recvInfo,
  destinationAddress,
  onFinish,
  // onInvoice,
  // buisnessName,
  setBoltzLoadingAnimation
) => {
  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32);
  const keys = ECPairFactory(ecc).makeRandom();
  const signature = keys.signSchnorr(
    crypto.sha256(Buffer.from(destinationAddress, "utf-8"))
  );
  const invoiceAmount = Math.round(Number(recvInfo.amount));
  const description = PAYMENT_DESCRIPTION;

  const createdResponse = await fetchFunction(
    `${getBoltzApiUrl(process.env.REACT_APP_ENVIRONMENT)}/v2/swap/reverse`,
    {
      address: destinationAddress,
      addressSignature: signature.toString("hex"),
      claimPublicKey: keys.publicKey.toString("hex"),
      description: description,
      from: "BTC",
      onchainAmount: invoiceAmount,
      preimageHash: crypto.sha256(preimage).toString("hex"),
      referralId: "blitzWallet",
      to: "L-BTC",
    },
    "post"
  );

  // Show invoice on wallet UI
  setBoltzLoadingAnimation("");
  // onInvoice(createdResponse.invoice);

  const claimInfo = {
    claimed: false,
    claimTx: "",
    createdResponse,
    destinationAddress,
    lastStatus: "",
    preimage,
    keys,
  };

  // Wait for Boltz to lock funds onchain and than claim them
  waitAndClaim(claimInfo, onFinish, setBoltzLoadingAnimation);
  return claimInfo;
};

export const getLiquidAddress = async (invoice, magicHint) => {
  const bip21Data = await (
    await fetch(
      `${getBoltzApiUrl(
        process.env.REACT_APP_ENVIRONMENT
      )}/v2/swap/reverse/${invoice}/bip21`
    )
  ).json();
  const bip21Split = bip21Data.bip21.split(":");
  const bip21Address = bip21Split[1].split("?")[0];

  if (
    !ECPairFactory(ecc)
      .fromPublicKey(Buffer.from(magicHint.pubkey, "hex"))
      .verifySchnorr(
        crypto.sha256(Buffer.from(bip21Address, "utf-8")),
        Buffer.from(bip21Data.signature, "hex")
      )
  ) {
    throw "BOLTZ IS TRYING TO CHEAT";
  }

  return bip21Address;
};
