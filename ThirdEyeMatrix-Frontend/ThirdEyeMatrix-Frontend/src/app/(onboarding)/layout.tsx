"use client";


import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Check if steps are completed
  useEffect(() => {
    const isWelcomeCompleted = localStorage.getItem('welcomeCompleted') === 'true';
    const isShopifyCompleted = localStorage.getItem('shopifyCompleted') === 'true';
    
    const completed = [];
    if (isWelcomeCompleted) completed.push('welcome');
    if (isShopifyCompleted) completed.push('shopify');
    
    setCompletedSteps(completed);

    // Listen for custom events to update state immediately
    const handleWelcomeCompleted = () => {
      setCompletedSteps(prev => [...prev, 'welcome']);
    };

    const handleShopifyCompleted = () => {
      setCompletedSteps(prev => [...prev, 'shopify']);
    };

    window.addEventListener('welcomeCompleted', handleWelcomeCompleted);
    window.addEventListener('shopifyCompleted', handleShopifyCompleted);

    return () => {
      window.removeEventListener('welcomeCompleted', handleWelcomeCompleted);
      window.removeEventListener('shopifyCompleted', handleShopifyCompleted);
    };
  }, []);

  const isStepCompleted = (step: string) => completedSteps.includes(step);
  return (
    <div className="flex flex-col h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center h-16 px-4 border bg-white shadow-sm md:px-6 justify-between">
        <Link
          className="text-xl sm:text-2xl font-semibold font-custom"
          href="#"
        >
          ThirdEyeMatrix
        </Link>
        <Link className="text-sm sm:text-lg font-custom font-medium" href="#">
          Return to shop list
        </Link>
      </header>

      <nav className="fixed top-13 left-0 right-0 z-40 mt-5 sm:px-4 bg-white py-4 ">
        <div className="overflow-x-auto mx-auto p-2 max-w-full scrollbar-hide">
          <div className="flex flex-nowrap gap-4 font-custom font-md font-medium">
            <Link href="/welcome">
              {" "}
              <div className={`flex space-x-4 p-3 border rounded-lg min-w-[400px] cursor-pointer ${isStepCompleted('welcome') ? 'bg-green-50 border-green-200' : ''}`}>
                <input 
                  type="radio" 
                  className="h-6 w-6 " 
                  checked={isStepCompleted('welcome')}
                  readOnly
                />
                <div className="flex justify-between items-center w-full">
                  <p className="">Welcome</p>
                  {isStepCompleted('welcome') && (
                    <span className="text-green-600 font-medium text-sm">Let's go!</span>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/welcome/setup">
              <div className={`flex space-x-4 p-3 border rounded-lg min-w-[400px] cursor-pointer ${isStepCompleted('shopify') ? 'bg-green-50 border-green-200' : ''}`}>
                <input 
                  type="radio" 
                  className="h-6 w-6" 
                  checked={isStepCompleted('shopify')}
                  readOnly
                />
                <div className="flex justify-between items-center w-full">
                  <p>Connect Store</p>
                  {isStepCompleted('shopify') && (
                    <span className="text-green-600 font-medium text-sm">Done!</span>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/welcome/integrations"> 
            <div className="flex space-x-4 p-3 border rounded-lg min-w-[400px] cursor-pointer">
              <input type="radio" className="h-6 w-6" />
              <p>Integrations</p>
            </div>
            </Link>

           <Link href="/welcome/shipping-costs"> 
            <div className="flex space-x-4 p-3 border rounded-lg min-w-[400px] cursor-pointer">
              <input type="radio" className="h-6 w-6" />
              <p>Shipping Costs</p>
            </div>
            </Link>

            <Link href="/welcome/invite-members" >
            <div className="flex space-x-4 p-3 border rounded-lg min-w-[400px] cursor-pointer">
              <input type="radio" className="h-6 w-6" />
              <p>Invite Members</p>
            </div>
            </Link>

            <Link href="/welcome/summary" > 
            <div className="flex space-x-4 p-3 border rounded-lg min-w-[400px] cursor-pointer">
              <input type="radio" className="h-6 w-6" />
              <p>Summary</p>
            </div>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 min-h-[80vh] px-2 sm:px-4 pt-32">{children}</main>
    </div>
  );
}
