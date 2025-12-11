"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/stores/app-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface MobileHeaderProps {
  tenantName?: string;
  user?: any;
  branches?: any[];
}

export function MobileHeader({
  tenantName,
  user,
  branches = [],
}: MobileHeaderProps) {
  const { setSidebarOpen } = useAppStore();
  const [notificationCount] = useState(0); // Reset to 0 or fetch real count
  const {
    currentBranch: storeCurrentBranch,
    branches: storeBranches,
    setCurrentBranch,
    setBranches,
  } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (branches && branches.length > 0) {
      setBranches(branches);
      const exists =
        storeCurrentBranch &&
        branches.some((b) => b.id === storeCurrentBranch.id);
      if (!exists) {
        setCurrentBranch(branches[0]);
      }
    }
  }, [branches]);

  const currentBranch = useMemo(() => {
    if (storeCurrentBranch) return storeCurrentBranch;
    if (storeBranches && storeBranches.length > 0) return storeBranches[0];
    if (branches && branches.length > 0) return branches[0];
    return { name: "Merkez" } as any;
  }, [storeCurrentBranch, storeBranches, branches]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
      {/* Left: Menu & Logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              SA
            </span>
          </div>
          <span className="hidden text-sm font-semibold sm:inline-block">
            {tenantName || "Spor Okulu"}
          </span>
        </div>
      </div>

      {/* Center: Branch Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
            <span className="max-w-24 truncate">{currentBranch?.name}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuLabel>Şube Seçin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {storeBranches && storeBranches.length > 0 ? (
            storeBranches.map((branch) => (
              <DropdownMenuItem
                key={branch.id}
                className="cursor-pointer"
                onClick={() => {
                  setCurrentBranch(branch);
                  const params = new URLSearchParams(searchParams?.toString());
                  params.set("branch", branch.id);
                  router.push(`${pathname}?${params.toString()}`);
                  router.refresh();
                }}
              >
                <span
                  className={
                    branch.id === currentBranch?.id
                      ? "font-medium text-primary"
                      : ""
                  }
                >
                  {branch.name}
                </span>
                {branch.isMain && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ana
                  </span>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>Şube bulunamadı</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {notificationCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback
                  name={user?.full_name}
                  className="bg-primary text-xs text-primary-foreground"
                />
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.full_name || "Kullanıcı"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Ayarlar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" asChild>
              <Link href="/auth/logout">Çıkış Yap</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
