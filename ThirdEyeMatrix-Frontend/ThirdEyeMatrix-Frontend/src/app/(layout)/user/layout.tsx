"use client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, Store, User, LogOut } from "lucide-react";
import { UserAppSidebar } from "@/components/user-app-sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import profileImage from "@/assets/images/profileImage.png"; // Import profileImage
import { DashboardProvider } from "@/contexts/DashboardContext";

type TokenPayload = {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };

  iat: number;
  exp: number;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStoresOpen, setIsStoresOpen] = useState(false);
  const [decodedUser, setDecodedUser] = useState<string | null>(null);
  const [showSignoutModal, setShowSignoutModal] = useState(false); // New state for modal
  const [avatar, setAvatar] = useState<string | null>(null); // State for avatar URL
  const router = useRouter();

  const handleSignout = () => {
    localStorage.removeItem("User_token");
    router.push("/auth/user/signin");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const Token = localStorage.getItem("User_token");
      if (!Token) {
        router.push("/auth/user/signin");
        return;
      }

      const fetchUserProfile = async () => {
        try {
          const response = await fetch(
            "http://localhost:5000/api/user/profile",
            {
              headers: {
                Authorization: `Bearer ${Token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch user profile");
          }

          const data = await response.json();
          const username = data.first_name && data.last_name
            ? `${data.first_name} ${data.last_name}`
            : data.email;
          setDecodedUser(username);
          setAvatar(data.avatar || null); // Set avatar from fetched data
        } catch (error) {
          console.error("Error fetching user profile:", error);
          router.push("/auth/user/signin");
        }
      };

      fetchUserProfile();
    }
  }, [router]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 w-full border-b bg-white/70 backdrop-blur [backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/user/dashboard"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <h2 className="text-xl sm:text-2xl font-semibold font-custom">
                ThirdEyeMatrix
              </h2>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-5" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-1 py-5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <img
                  src={avatar || profileImage.src}
                  alt={decodedUser || "User Avatar"}
                  className="h-8 w-8  rounded-full object-cover"
                />
                <p className="hidden  sm:inline-block sm:text-medium font-medium font-custom">
                  {decodedUser}
                </p>
                <ChevronDown
                  className={`  h-4 w-4 text-gray-500 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="relative group">
                    <div
                      className="flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setIsStoresOpen(!isStoresOpen)}
                    >
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5" />
                        <span className="font-custom sm:text-medium font-medium">
                          Stores
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition-transform ${
                          isStoresOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {/* Sub-items below Stores - only visible when Stores is clicked */}
                    {isStoresOpen && (
                      <div className="  ">
                        <Link
                          href="#"
                          className="flex items-center gap-3 px-10 h-10  text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-sm font-medium border-l-2 border-transparent "
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="w-2 h-2 ms-2 rounded-full bg-gray-500"></div>
                          <span className="font-custom text-sm font-medium ps-2">
                            ABC
                          </span>
                        </Link>
                        <Link
                          href="#"
                          className="flex items-center gap-3 px-10 h-10 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-sm font-medium border-l-2 border-transparent "
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="w-2 h-2 ms-2 rounded-full bg-gray-500"></div>
                          <span className="font-custom text-sm font-medium ps-2">
                            XYZ
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/user/profile"
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-custom font-medium">
                      Account Profile
                    </span>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    onClick={() => {
                      setShowSignoutModal(true); // Open modal instead of direct signout
                      setIsDropdownOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-custom font-medium">Signout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <DashboardProvider>
          <SidebarProvider>
            <UserAppSidebar />
            <main className="flex-1 overflow-x-hidden  ">
              <SidebarTrigger />
              {children}
            </main>
          </SidebarProvider>
        </DashboardProvider>
      </div>

      {/* Signout Confirmation Modal */}
      {showSignoutModal && (
        <div className="fixed inset-0 z-50  flex items-center justify-center bg-gray/100 backdrop-blur-xs backdrop-brightness-50">
          <div className="md:w-[400px] bg-white p-8 rounded-xl shadow-2xl  mx-4  border border-gray-200">
            <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4 font-custom ">Confirm Sign Out</h3>
            <p className="text-gray-700 text-center mb-6 font-custom">Are you sure you want to sign out?</p>
            <div className=" grid grid-cols-2 gap-2 font-custom ">
              <Button variant="ghost" onClick={() => setShowSignoutModal(false)} className="border text-md w-full py-[18px] cursor-pointer bg-gray-100 hover:bg-gray-200" >
                Cancel
              </Button>
              <Button className="cursor-pointer py-[18px] text-md hover:bg-red-500 " variant="destructive" onClick={() => {
                handleSignout();
                setShowSignoutModal(false);
              }}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
