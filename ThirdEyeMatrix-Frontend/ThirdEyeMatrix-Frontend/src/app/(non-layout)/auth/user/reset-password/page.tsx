'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import resetPasswordImage from "../../../../../assets/images/ResetPassword.png"
import { useRouter } from 'next/navigation'
import ReCAPTCHA from "react-google-recaptcha"
import { toast } from 'react-toastify';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
 
  }

   function onRecaptchaChange(token: string | null) {
    setRecaptchaToken(token);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { password, confirmPassword } = formData
    if (!recaptchaToken) {
      toast.error('Please complete the reCAPTCHA', {
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '10px',
        },
      });
      return;
    }
    if (!password || !confirmPassword) {
      toast.error('Please fill in both fields', {
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '10px',
        },
      });
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters', {
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '10px',
        },
      });
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '10px',
        },
      });
      return
    }

    setLoading(true);

    try {
   
      const userId = localStorage.getItem("user_Id"); // Re-add retrieval of userId

      if ( !userId) {
        toast.error("User information not found. Please restart the password reset process.", {
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '10px',
          },
        });
        setLoading(false);
        return;
      }

      const basicAuthToken = btoa(
        `${process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME}:${process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD}`
      );

      const response = await fetch('http://localhost:5000/api/user/auth/resetPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuthToken}`,
        },
        body: JSON.stringify({
          newPassword: password,
          userId,
          captcha: recaptchaToken, 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Password has been reset successfully", {
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '10px',
          },
        });
        localStorage.removeItem("userEmailForReset");
        localStorage.removeItem("user_Id"); 
        setFormData({ password: '', confirmPassword: '' });
        setRecaptchaToken(null);
        router.push("/auth/user/signin");
      } else {
        toast.error(data.message || 'Failed to reset password', {
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '10px',
          },
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('An unexpected error occurred. Please try again.', {
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '10px',
        },
      });
    } finally {
      setLoading(false);
    }
  }

 

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r  from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src={resetPasswordImage}
            alt="Reset Password image banner"
            className="absolute inset-0 w-full h-full img-fluid"
            loading="lazy"
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 md:p-12">
          <div className="w-full sm:max-w-md md:max-w-lg lg:max-w-md bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
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

              {/* ReCAPTCHA */}
              <div className="mt-4 w-full flex justify-center items-center bg-[#f9f9f9] p-2 rounded-lg">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                  onChange={onRecaptchaChange}
                />
              </div>

              <button
                type="submit"
                disabled={!recaptchaToken && !formData.password && !formData.confirmPassword}
                className={`w-full py-2 mt-1 font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md 
                    ${
                      recaptchaToken && formData.password && formData.confirmPassword
                      ? "cursor-pointer bg-[#37B5FF] hover:opacity-90"
                      : "cursor-not-allowed bg-[#37b6ff9c]"
                    }`}
              >
                Set Password
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  )
}


