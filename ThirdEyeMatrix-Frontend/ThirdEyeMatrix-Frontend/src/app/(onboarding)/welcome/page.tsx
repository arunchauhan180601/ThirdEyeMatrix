"use client";

import { useRouter } from "next/navigation";
import logo from "@/assets/images/logo.png";

export default function Welcome() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Mark welcome step as completed
    localStorage.setItem('welcomeCompleted', 'true');
    
    // Trigger a custom event to update the layout state immediately
    window.dispatchEvent(new CustomEvent('welcomeCompleted'));
    
    // Small delay to show the completion state before redirecting
    setTimeout(() => {
      router.push('/welcome/setup');
    }, 1000);
  };
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center font-custom p-4">
        <div>
          <img src={logo.src} alt="logo" height={330} width={330} className="image-fluid" />
        </div>
        <h1 className="text-2xl  sm:text-3xl font-bold text-gray-800 mb-4 ">
          Welcome to Third Eye Matrix!
        </h1>
        <p className="text-sm sm:text-md text-gray-600 mb-8 max-w-xl">
          You’re just minutes away from transforming your data into profitable
          growth. There are a few things that need to be set up first. Ready to
          get started?
        </p>
        <button 
          onClick={handleGetStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 sm:py-2 sm:px-8 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Get started
        </button>
      </div>
    </>
  );
}
