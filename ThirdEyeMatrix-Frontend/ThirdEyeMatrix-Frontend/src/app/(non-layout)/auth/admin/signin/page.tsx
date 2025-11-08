"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {  toast } from "react-toastify";
import { loginUser } from "@/api/auth/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      toast.success("Login Successful!", {
        position: "top-right",
        autoClose: 2000,
        style: {
        fontSize: "16px",
        fontWeight: "bold",
        borderRadius: "10px",
        borderBottomColor:"#37b6ffe0"
        } ,

      });

      console.log(data);

      // Saved tokens to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role)

      //  redirect after login
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
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
      console.error(" Login Error:", err.message);
    } finally {
      setLoading(false);
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r p-1 from-sky-100 via-white-50 to-white-50">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl dark:bg-dark-900">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-3xl font-bold text-black font-custom mb-2">
            Sign In
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom">
            Please sign in to continue
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
              id="emailOrUsername"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border font-sm font-custom   border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block mb-1 text-md font-semibold font-custom"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 font-custom border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 flex items-center text-gray-500 ltr:right-3 rtl:left-3"
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-gray-600 dark:text-gray-400 font-custom">
                Remember me
              </span>
            </label>
            <Link
              href="/auth/admin/forget-password"
              className="text-danger-500 text-sm hover:text-primary-600 font-medium text-[#37B5FF] font-custom"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading }
            className="w-full py-2 mt-1 font-semibold text-white  cursor-pointer font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="relative my-3 text-center text-gray-500 before:absolute before:border-gray-200 before:w-full ltr:before:left-0 rtl:before:right-0 before:top-2.5 before:border-b">
          <span className="relative inline-block px-2 bg-white dark:bg-dark-900 text-sm">OR</span>
        </div>
        <button
          type="button"
          className="w-full py-2 border cursor-pointer border-gray-300 rounded-lg font-custom font-medium hover:bg-gray-50 dark:hover:bg-dark-850 transition flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.689 32.449 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.754 6.053 29.624 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.655 16.368 18.961 14 24 14c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.754 6.053 29.624 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.191l-6.191-5.238C29.223 36 24.757 32.449 24 32.449c-5.019 0-9.31-3.356-10.853-7.946l-6.59 5.08C9.87 39.556 16.42 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.101 3.113-3.353 5.553-5.895 7.028l.004-.003 6.191 5.238C38.723 37.207 44 31.5 44 24c0-1.341-.138-2.651-.389-3.917z"/>
          </svg>
          <span>Sign in with Google</span>
        </button>
      </div>

   
    </div>
  );
}
