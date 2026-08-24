"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const { session, isLoading, signOut } = useAuth();
  const user = session?.user;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-custom bg-charcoal/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-amber-dark">
            <Layers className="h-4 w-4 text-charcoal" />
          </div>
          <span className="text-lg font-semibold text-text">Sediment</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm text-text-muted hover:text-text transition-colors">Features</Link>
          <Link href="/about" className="text-sm text-text-muted hover:text-text transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-surface-raised" />
          ) : session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-text-muted hover:text-text">
                  Dashboard
                </Button>
              </Link>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    />
                  }
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-raised">
                    <User className="h-4 w-4 text-text-muted" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-surface border-border-custom" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-text">{user?.name || "User"}</p>
                        <p className="text-xs leading-none text-text-muted">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border-custom" />
                    <DropdownMenuItem onClick={() => signOut()} className="text-text-muted hover:text-text focus:text-text">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-text-muted hover:text-text">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-amber hover:bg-amber-light text-charcoal font-medium">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
