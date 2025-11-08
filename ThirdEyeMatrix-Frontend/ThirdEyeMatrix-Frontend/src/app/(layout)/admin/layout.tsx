"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";

type TokenPayload = {
  id: string;
  roleName: string;
  iat: number;
  exp: number;
  name: string;
  first_name: string,
  last_name: string,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
 const [decodedUser, setDecodedUser] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const Token = localStorage.getItem("token");
      if (!Token) {
        router.push("/auth/Admin/Signin");
      } else {
        setIsLoggedIn(true);
      }
    }
  }, [router]);

  useEffect(() => {
  function tokenDetails() {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode<TokenPayload>(token);
      console.log("Decoded token:", decoded);

      // If backend actually has 'name', use it; otherwise pick something else (roleName or id)
     const username = decoded.first_name && decoded.last_name ? `${decoded.first_name} ${decoded.last_name}` : decoded.name;

      setDecodedUser(username);
    }
  }

  tokenDetails();
}, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/Admin/dashboard"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <h2 className="text-lg sm:text-2xl font-semibold font-custom">ThirdEyeMatrix</h2>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="hover:bg-gray-200">
              <Bell className="size-5" />
            </Button>

            <Button
              variant="ghost"
              className="px-4 py-5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <img
                src="https://i.pravatar.cc/64?u=john.doe@example.com"
                alt="John Doe"
                className=" h-8 w-8 rounded-full object-cover "
              />
              <p className="sm:inline-block sm:text-medium font-medium font-custom">
                {decodedUser}
              </p>
            </Button>
          </div>  
        </div>
      </header>

      <div className="pt-16">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <SidebarTrigger />
            {isLoggedIn ? children : null}
          </main>
        </SidebarProvider>
      </div>
    </>
  );
}
