import { prisma } from "./prisma";

interface NotifyParams {
  storeId?: string | null;
  orderId?: string | null;
  channel: "WHATSAPP" | "EMAIL" | "SMS";
  recipient: string;
  subject: string;
  message: string;
}

export async function sendTransactionalNotification(params: NotifyParams) {
  let status: "SENT" | "QUEUED" | "FAILED" = "SENT";

  try {
    // Optional real provider dispatch when environment variables are configured
    if (params.channel === "EMAIL" && process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Albedo'o <notifications@albedoo.cm>",
          to: [params.recipient],
          subject: params.subject,
          text: params.message,
        }),
      });
    } else if (params.channel === "WHATSAPP" && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
      await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.recipient.replace(/[^0-9]/g, ""),
          type: "text",
          text: { body: `${params.subject}\n${params.message}` },
        }),
      });
    }
  } catch (error) {
    console.error("Notification dispatch error:", error);
    status = "FAILED";
  }

  return prisma.notificationLog.create({
    data: {
      storeId: params.storeId || null,
      orderId: params.orderId || null,
      channel: params.channel,
      recipient: params.recipient,
      subject: params.subject,
      message: params.message,
      status,
    },
  });
}
