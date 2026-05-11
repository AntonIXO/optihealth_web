"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  LayoutDashboard, 
  BarChart3, 
  Brain, 
  Settings, 
  LogOut,
  Menu,
  X,
  Plus
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DashboardNavProps {
  user: User;
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Data", href: "/dashboard/data", icon: BarChart3 },
    { name: "Journal", href: "/dashboard/journal", icon: Brain },
    { name: "Supplements", href: "/dashboard/supplements", icon: BarChart3 },
    { name: "Cabinet", href: "/dashboard/supplements/cabinet", icon: BarChart3 },
    { name: "Insights", href: "/dashboard/insights", icon: Brain },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center font-bold text-white shadow-sm">
                <span className="sr-only">optiHealth</span>
                <span className="text-sm">oH</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">optiHealth</h1>
            </div>
            <div className="hidden sm:flex sm:space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <Link href="/dashboard/data">
              <Button variant="glass" size="sm" className="hidden lg:flex">
                <Plus className="h-4 w-4 mr-1" />
                Log data
              </Button>
            </Link>

            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon" className="hidden lg:flex">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            <div className="ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 font-semibold text-white text-[13px] flex items-center justify-center shadow-sm">
              {initials}
            </div>
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="space-y-1 pb-3 pt-2 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                </Link>
              );
            })}

            <div className="mt-4 pt-4 border-t border-white/10">
              <Link
                href="/dashboard/data"
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5" />
                  Log data
                </div>
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-base font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5" />
                  Sign out
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
