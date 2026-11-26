import { hasIcon, productSvg } from "@/lib/product-art";

const HEX = /^[0-9a-fA-F]{6}$/;

/**
 * Generated product artwork for products created in the admin panel:
 * /api/art/Drill/1?c=1E3A5F-3B82F6  (variant 1–3, two hex colours).
 */
export function GET(req: Request, { params }: { params: { icon: string; variant: string } }) {
  const v = Number(params.variant);
  if (!hasIcon(params.icon) || ![1, 2, 3].includes(v)) return new Response("Not found", { status: 404 });
  const [c1, c2] = (new URL(req.url).searchParams.get("c") ?? "0F5F5A-2BB3A3").split("-");
  if (!HEX.test(c1 ?? "") || !HEX.test(c2 ?? "")) return new Response("Bad colour", { status: 400 });

  return new Response(productSvg(params.icon, [`#${c1}`, `#${c2}`], (v - 1) as 0 | 1 | 2), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
