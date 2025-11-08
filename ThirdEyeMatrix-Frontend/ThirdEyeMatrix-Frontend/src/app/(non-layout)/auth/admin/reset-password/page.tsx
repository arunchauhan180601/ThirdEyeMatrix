'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';
import { resetPasswordApi } from "@/api/auth/auth";

export default function AdminResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { password, confirmPassword } = formData
    if (!password || !confirmPassword) {
      toast.error('Please fill in both fields', {
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
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters', {
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
    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
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
      const userId = localStorage.getItem("userId"); // Assuming userId is stored after OTP verification
      if (!userId) {
        toast.error("User ID not found, please restart the password reset process.", {
          position: "top-right",
          autoClose: 2000,
          style: {
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "10px",       
          } 
        });
        return;
      }
      const data = await resetPasswordApi(userId, password);
      toast.success(data?.message || 'Password has been reset successfully', {
        position: "top-right",
        autoClose: 2000,
         style: {
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "10px",       
        } 
      });
      localStorage.removeItem("userId"); // Clear userId after successful reset
      setFormData({ password: '', confirmPassword: '' });
      router.push("/auth/admin/signin");
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
      console.error("Reset Password Error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-sky-100 via-white-50 to-white-50">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-3xl mb-2  font-bold text-black  font-custom">Reset Password</h1>
           <p className="text-sm font-medium font-custom text-gray-600" >
            Please Reset Your Password.
          </p>
          
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="passwordInput" className="block mb-1 text-md font-semibold font-custom">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="passwordInput"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                placeholder="Enter new password"
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

          <div>
            <label htmlFor="confirmPasswordInput" className="block mb-1 text-md font-semibold font-custom">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPasswordInput"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 flex items-center text-gray-500 ltr:right-3 rtl:left-3"
              >
                {showConfirmPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90"
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>
      </div>

   
    </div>
  )
}
