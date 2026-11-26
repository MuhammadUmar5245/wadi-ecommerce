import { ScopedMessages } from "@/components/scoped-messages";

/** Checkout, payment and confirmation pages need checkout, payment and address strings on the client. */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <ScopedMessages namespaces={["checkout", "payment", "address", "auth"]}>{children}</ScopedMessages>;
}
