import fetchFunction from "./fetchFunction";

// {
//  tx: {
//    amount: 5000,
//    tipAmount: 0,
//    serverName: "blake",
//    date: new Date().getTime(),
//  },
//  storeName: "test1",
// }

export default async function pushTransactionToDB(tx) {
  try {
    const response = await fetchFunction("/addTxActivity", tx, "post");
    if (response.status !== "SUCCESS") throw new Error(response.reason);
    return true;
  } catch (err) {
    console.log("error pushing trasnction to database");
    return false;
  }
}
