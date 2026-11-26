"use client";

import { useTranslations } from "next-intl";
import { Heart, LayoutDashboard, LogIn, LogOut, MapPin, Package, Shield, User, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/server/auth-actions";

export type MenuUser = { name: string; email: string; role: string } | null;

export function AccountMenu({ user }: { user: MenuUser }) {
  const t = useTranslations("header");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted data-[state=open]:bg-muted"
        aria-label={t("account")}
      >
        {user ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
        ) : (
          <User className="h-5 w-5" aria-hidden />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {user ? (
          <>
            <DropdownMenuLabel>
              <span className="block truncate">{user.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.role !== "CUSTOMER" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield aria-hidden /> {t("adminPanel")}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/account">
                <LayoutDashboard aria-hidden /> {t("dashboard")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/orders">
                <Package aria-hidden /> {t("myOrders")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/wishlist">
                <Heart aria-hidden /> {t("wishlist")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/addresses">
                <MapPin aria-hidden /> {t("addresses")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/profile">
                <User aria-hidden /> {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-destructive">
                  <LogOut aria-hidden /> {t("logout")}
                </button>
              </DropdownMenuItem>
            </form>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogIn aria-hidden /> {t("login")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register">
                <UserPlus aria-hidden /> {t("register")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
