import envVariables from "../../config/env";
import { ISSLCommerz } from "./sslCommerz.interface";

const sslPaymentInit = (payload: ISSLCommerz) => {
  const data = {
    store_id: envVariables.SSL.SSL_STORE_ID,
    store_passwd: envVariables.SSL.SSL_STORE_PASSWORD,
    total_amount: payload.amount,
    currency: "BDT",
    tran_id: payload.transactionId,
    success_url: "",
    fail_url: "",
    cancel_url: "",
    // ipn_url: "http://localhost:3030/ipn",
    shipping_method: "N/A",
    product_name: "Tour",
    product_category: "Service",
    product_profile: "general",
    cus_name: payload.name,
    cus_email: payload.email,
    cus_add1: payload.address,
    cus_add2: "N/A",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: payload.phoneNumber,
    cus_fax: "01711111111",
    ship_name: "N/A",
    ship_add1: "N/A",
    ship_add2: "N/A",
    ship_city: "N/A",
    ship_state: "N/A",
    ship_postcode: 1000,
    ship_country: "N/A",
  };
};
