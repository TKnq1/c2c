import { headers } from "next/headers";
import { nativePlatformFromUserAgent, type NativePlatformName } from "@/lib/native-app";

// Which store app (if any) the current request comes from. Reads a request
// header, so it opts the calling route into dynamic rendering.
export async function getNativePlatform(): Promise<NativePlatformName | null> {
  const headerList = await headers();
  return nativePlatformFromUserAgent(headerList.get("user-agent"));
}

// Pro is only sold on the web. Inside the store apps a digital subscription
// would have to go through Apple's In-App Purchase (App Store rule 3.1.1)
// or Google Play Billing (Play's payments policy), so both apps show the
// current plan without any upgrade offer, and the checkout action refuses.
export async function canSellProSubscription() {
  return (await getNativePlatform()) === null;
}
