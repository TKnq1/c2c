import Stripe from "stripe";

// Lazy on purpose: constructing eagerly at module scope throws immediately
// if STRIPE_SECRET_KEY is unset, and Next.js evaluates this module while
// statically analyzing routes at build time (not just at request time) —
// an unset key would then fail the whole build, not just Stripe requests.
// The Proxy defers that check to the first real call, at runtime.
let client: Stripe | undefined;

function getClient(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-08-26.dahlia" });
  }
  return client;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
