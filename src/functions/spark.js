import { SparkWallet } from "@buildonspark/spark-sdk";
import { getLocalStorageItem, saveToLocalStorage } from "./localStorage";

export let sparkWallet = null;
export async function createSparkWallet() {
  if (sparkWallet) return;
  let wallet;
  let numberOfTries = 0;
  const maxNumberOfTries = 5;

  while (numberOfTries < maxNumberOfTries && !wallet) {
    numberOfTries++;
    try {
      const { wallet: w } = await SparkWallet.initialize({
        options: {
          network: "MAINNET",
        },
      });
      wallet = w;

      break;
    } catch (err) {
      console.log("Spark wallet initialization error", err.message);
    }

    if (!wallet) {
      console.log(`Running attempt ${numberOfTries} of ${maxNumberOfTries}`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  sparkWallet = wallet;
}

export const receiveSparkLightningPayment = async ({
  amountSats,
  memo,
  receiverIdentityPubkey,
}) => {
  try {
    if (!sparkWallet) throw new Error("sparkWallet not initialized");
    let payment;

    payment = await sparkWallet.createLightningInvoice({
      amountSats,
      memo,
      expirySeconds: 60 * 15,
      receiverIdentityPubkey,
    });

    let savedPaymentCodes =
      JSON.parse(getLocalStorageItem("spark_pending_ids")) || [];

    savedPaymentCodes.push({ ...payment, timeAdded: new Date().getTime() });

    saveToLocalStorage(JSON.stringify(savedPaymentCodes), "spark_pending_ids");

    return payment;
  } catch (err) {
    console.log("Receive lightning payment error", err);
  }
};

export const getSparkTransactions = async (
  transferCount = 100,
  offsetIndex
) => {
  try {
    if (!sparkWallet) throw new Error("sparkWallet not initialized");
    return await sparkWallet.getTransfers(transferCount, offsetIndex);
  } catch (err) {
    console.log("get spark transactions error", err);
  }
};

export const getSparkLightningPaymentStatus = async (lightningInvoiceId) => {
  try {
    if (!sparkWallet) throw new Error("sparkWallet not initialized");
    return await sparkWallet.getLightningReceiveRequest(lightningInvoiceId);
  } catch (err) {
    console.log("Get lightning payment status error", err);
  }
};

export default async function lookForPaidPayment(convertedSatAmount) {
  try {
    const savedPaymentCodes =
      JSON.parse(getLocalStorageItem("spark_pending_ids")) || [];

    if (!savedPaymentCodes.length) return false;

    const currentTime = new Date().getTime();
    const possibleOptions = savedPaymentCodes.filter((item) => {
      return item.invoice.amount.originalValue / 1000 === convertedSatAmount;
    });

    const removeIds = [];
    let wasPaid = false;

    for (const invoice of possibleOptions) {
      try {
        const paymentStatus = await getSparkLightningPaymentStatus(invoice.id);
        if (paymentStatus === null) {
          removeIds.push(invoice.id);
          continue;
        }
        if (paymentStatus.transfer) {
          wasPaid = true;
          removeIds.push(invoice.id);
          break;
        } else if (Math.abs(invoice.timeAdded - currentTime) > 1000 * 60 * 15) {
          removeIds.push(invoice.id);
        }
      } catch (error) {
        console.error(
          `Failed to check payment status for ${invoice.id}:`,
          error
        );
      }
    }

    if (removeIds.length) {
      const newListOfIds = savedPaymentCodes.filter(
        (item) => !removeIds.includes(item.id)
      );
      saveToLocalStorage(JSON.stringify(newListOfIds), "spark_pending_ids");
    }

    return wasPaid;
  } catch (error) {
    console.error("Error in lookForPaidPayment:", error);
    return false;
  }
}
