"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";
import { sendOtpApi } from "@/api/auth/auth";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await sendOtpApi(email);
      toast.success(data?.message || "OTP sent to your email!", {
        position: "top-right",
        autoClose: 2000,
         style: {
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "10px",       
        } 
      });
      localStorage.setItem("forgotPasswordEmail", email); // Store email in localStorage
      router.push("/auth/admin/two-step-verification");
    } catch (err: any) {
      toast.error(err.message, {
        position: "top-right",
        autoClose: 2000,
        style: {
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "10px",       
          } 
      });
      console.error("Forgot Password Error:", err.message);
    } finally {
      setLoading(false);
      setEmail("");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r p-1 from-sky-100 via-white-50 to-white-50">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl dark:bg-dark-900">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-3xl font-bold text-black font-custom mb-2">
            Forget Password
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 font-custom">
            Enter your email to receive a One-Time Password
          </p>
        </div>

        <form onSubmit={handleSubmit} method="POST" className="space-y-5">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block mb-1 text-md font-semibold font-custom"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border font-sm font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-1 font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className="text-center mt-5">
                <span className='font-custom'>Return To the </span>
                <Link href="/auth/admin/signin" className="text-sky-400 font-medium font-custom">
                   Sign In  <MoveRight className="inline-block rtl:mr-1 ltr:ml-1 size-5" />
                </Link>
              </div>
      </div>

      
    </div>
  );
}
