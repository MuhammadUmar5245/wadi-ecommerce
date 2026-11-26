import type { OrderStatus } from "./constants";

/** Bilingual notification copy for order status changes (stored in both languages). */
export function statusNotification(status: OrderStatus, orderNumber: string) {
  const n = orderNumber;
  const map: Record<OrderStatus, { titleEn: string; titleAr: string; bodyEn: string; bodyAr: string }> = {
    PLACED: {
      titleEn: "Order placed",
      titleAr: "تم استلام طلبك",
      bodyEn: `Thank you! We have received your order ${n}.`,
      bodyAr: `شكراً لك! استلمنا طلبك رقم ${n}.`,
    },
    CONFIRMED: {
      titleEn: "Order confirmed",
      titleAr: "تم تأكيد طلبك",
      bodyEn: `Your order ${n} has been confirmed.`,
      bodyAr: `تم تأكيد طلبك رقم ${n}.`,
    },
    PROCESSING: {
      titleEn: "Order being prepared",
      titleAr: "جارٍ تجهيز طلبك",
      bodyEn: `Our team is preparing order ${n} for dispatch.`,
      bodyAr: `يعمل فريقنا على تجهيز طلبك رقم ${n} للشحن.`,
    },
    SHIPPED: {
      titleEn: "Order shipped",
      titleAr: "تم شحن طلبك",
      bodyEn: `Order ${n} has left our warehouse.`,
      bodyAr: `غادر طلبك رقم ${n} مستودعنا.`,
    },
    OUT_FOR_DELIVERY: {
      titleEn: "Out for delivery",
      titleAr: "طلبك في الطريق إليك",
      bodyEn: `Order ${n} is out for delivery today. Please keep your phone nearby.`,
      bodyAr: `طلبك رقم ${n} في طريقه إليك اليوم، يُرجى إبقاء هاتفك قريباً.`,
    },
    DELIVERED: {
      titleEn: "Order delivered",
      titleAr: "تم توصيل طلبك",
      bodyEn: `Order ${n} has been delivered. We hope you enjoy your purchase — you can now leave a review.`,
      bodyAr: `تم توصيل طلبك رقم ${n}. نتمنى أن تنال مشترياتك إعجابك، ويمكنك الآن تقييم المنتجات.`,
    },
    CANCELLED: {
      titleEn: "Order cancelled",
      titleAr: "تم إلغاء طلبك",
      bodyEn: `Order ${n} has been cancelled. Any card payment will be refunded.`,
      bodyAr: `تم إلغاء طلبك رقم ${n}، وسيُعاد أي مبلغ دُفع بالبطاقة.`,
    },
  };
  return map[status];
}

export function paymentNotification(kind: "SUCCEEDED" | "FAILED", orderNumber: string) {
  return kind === "SUCCEEDED"
    ? {
        titleEn: "Payment received",
        titleAr: "تم استلام الدفعة",
        bodyEn: `We have received your card payment for order ${orderNumber}.`,
        bodyAr: `استلمنا دفعتك بالبطاقة للطلب رقم ${orderNumber}.`,
      }
    : {
        titleEn: "Payment unsuccessful",
        titleAr: "تعذّرت عملية الدفع",
        bodyEn: `The card payment for order ${orderNumber} was declined. You can retry or choose cash on delivery.`,
        bodyAr: `رُفضت عملية الدفع بالبطاقة للطلب رقم ${orderNumber}. يمكنك إعادة المحاولة أو اختيار الدفع عند الاستلام.`,
      };
}
