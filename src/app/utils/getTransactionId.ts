import crypto from "crypto";
export const getTransactionId = () => {
  // const date = Date.now();
  // const randomNumber = Math.floor(Math.random() * 1000);
  const cryptoId = crypto.randomBytes(12).toString("hex");
  return `tran_${cryptoId}`;
};
