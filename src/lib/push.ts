import webpush from "web-push";
import { prisma } from "./prisma";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    "mailto:notifications@albedoo.cm",
    publicKey,
    privateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendWebPush(
  target: { userId?: string | null; storeId?: string | null },
  payload: PushPayload
): Promise<number> {
  if (!publicKey || !privateKey) return 0;

  const where = target.userId
    ? { userId: target.userId }
    : target.storeId
    ? { storeId: target.storeId }
    : null;

  if (!where) return 0;

  const subs = await prisma.pushSubscription.findMany({ where });
  if (subs.length === 0) return 0;

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/",
        })
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
  return sent;
}
