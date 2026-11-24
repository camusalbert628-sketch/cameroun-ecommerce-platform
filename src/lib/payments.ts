import crypto from "crypto";

export interface InitiatePaymentParams {
  reference: string;
  amountFcfa: number;
  currency?: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  description: string;
  paymentMethod: string;
  callbackUrl: string;
  returnUrl: string;
}

export interface InitiatePaymentResult {
  providerMode: "NOTCHPAY" | "CINETPAY" | "SANDBOX";
  authorizationUrl?: string;
  providerReference?: string;
  ussdHint?: string;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  const notchKey = process.env.NOTCHPAY_PUBLIC_KEY;
  if (notchKey) {
    const res = await fetch("https://api.notchpay.co/payments/initialize", {
      method: "POST",
      headers: {
        Authorization: notchKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: params.amountFcfa,
        currency: params.currency || "XAF",
        email: params.customerEmail || `${params.customerPhone.replace(/[^0-9]/g, "")}@client.albedoo.cm`,
        phone: params.customerPhone,
        name: params.customerName,
        reference: params.reference,
        description: params.description,
        callback: params.returnUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        providerMode: "NOTCHPAY",
        authorizationUrl: data.authorization_url,
        providerReference: data.transaction?.reference || params.reference,
      };
    }
  }

  const cinetApiKey = process.env.CINETPAY_API_KEY;
  const cinetSiteId = process.env.CINETPAY_SITE_ID;
  if (cinetApiKey && cinetSiteId) {
    const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: cinetApiKey,
        site_id: cinetSiteId,
        transaction_id: params.reference,
        amount: Math.max(100, Math.round(params.amountFcfa / 5) * 5),
        currency: params.currency || "XAF",
        description: params.description,
        notify_url: params.callbackUrl,
        return_url: params.returnUrl,
        customer_name: params.customerName,
        customer_phone_number: params.customerPhone,
        customer_email: params.customerEmail || "client@albedoo.cm",
        channels: params.paymentMethod === "CARD_VISA_MC" ? "CREDIT_CARD" : "MOBILE_MONEY",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data?.payment_url) {
        return {
          providerMode: "CINETPAY",
          authorizationUrl: data.data.payment_url,
          providerReference: data.data.payment_token || params.reference,
        };
      }
    }
  }

  const ussdHint =
    params.paymentMethod === "ORANGE_MONEY"
      ? "Composez #150*50# pour valider le paiement Orange Money (mode test)."
      : params.paymentMethod === "MTN_MOMO"
      ? "Composez *126# pour valider le paiement MTN MoMo (mode test)."
      : "Paiement carte sécurisé (mode test).";

  return {
    providerMode: "SANDBOX",
    providerReference: params.reference,
    ussdHint,
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
