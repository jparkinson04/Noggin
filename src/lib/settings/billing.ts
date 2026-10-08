/** Plan and billing. Mock data behind one function so Stripe can replace it in one place. */
export interface BillingSummary {
  plan: "solo" | "team" | "guided";
  planName: string;
  /** Pence. */
  pricePence: number;
  interval: "month";
  renewsOn: string;
  cardLast4: string | null;
}

export async function getBillingSummary(_userId: string): Promise<BillingSummary> {
  // TODO(dev): Stripe. Look up the customer by user id (store stripe_customer_id on brains or a
  // billing table), read the active subscription, its price and current_period_end, and the default
  // payment method's last4. "Change plan" → a Checkout or Customer Portal session; "Update payment
  // method" and "View invoices" → the Customer Portal.
  return {
    plan: "solo",
    planName: "Solo",
    pricePence: 1900,
    interval: "month",
    renewsOn: "2026-11-02",
    cardLast4: null,
  };
}
