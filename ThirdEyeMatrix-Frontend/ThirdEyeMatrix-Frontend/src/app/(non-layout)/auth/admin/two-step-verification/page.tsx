'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';

import { verifyOtpApi } from "@/api/auth/auth";

export default function OtpPage() {
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', ''])
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return
    const next = [...otpValues]
    next[index] = value
    setOtpValues(next)
    if (value && index < inputRefs.length - 1) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
    if ((e.key === 'ArrowLeft' || e.key === 'Left') && index > 0) {
      e.preventDefault()
      inputRefs[index - 1].current?.focus()
    }
    if ((e.key === 'ArrowRight' || e.key === 'Right') && index < inputRefs.length - 1) {
      e.preventDefault()
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const code = otpValues.join('')
    if (code.length !== 4) {
      toast.error('Please enter the 4-digit code', {
        position: "top-right",
        autoClose: 2000,
        style: {
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "10px",       
          } 
      });
      return
    }
    try {
      setLoading(true);
      const email = localStorage.getItem("forgotPasswordEmail") || ""; // Retrieve email
      const data = await verifyOtpApi(email, code);
      toast.success(data?.message || "OTP verified successfully!", {
        position: "top-right",
        autoClose: 2000,
        style: {
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "10px",       
        } 
      });
      localStorage.setItem("userId", data.userId);
      localStorage.removeItem("forgotPasswordEmail"); // Clear email
      router.push("/auth/admin/reset-password");
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
      console.error("OTP Verification Error:", err.message);
    } finally {
      setLoading(false);
      setOtpValues(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r px-1  from-sky-100 via-white-50 to-white-50">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl mb-3 font-bold text-black  font-custom"> Enter OTP </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom">
            Please enter the 4-digit code sent to your email.
          </p>
          
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-md font-semibold font-custom">
              OTP Code
            </label>
            <div className="grid grid-cols-4 gap-3">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-full text-center text-xl px-3 py-3 border font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  placeholder="0"
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
     
    </div>
  )
}
