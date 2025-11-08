'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import signupImage from "../../../../../assets/images/Sign up-rafiki.png"
import ReCAPTCHA from "react-google-recaptcha"


export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // setLoading(true)
    // setError(null)

    const { email, password, confirmPassword } = formData

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      setLoading(false);
      return;
    }

    if ( !email || !password || !confirmPassword) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }
    console.log( formData.email , formData.password , formData.confirmPassword, recaptchaToken)
    // Save data to local storage
    localStorage.setItem('signupEmail', email);
    localStorage.setItem('signupPassword', password);
    localStorage.setItem('recaptchaToken', recaptchaToken); // Save recaptchaToken to localStorage

    setFormData({
    email: '',  
    password: '',
    confirmPassword: '',
  } );
    setRecaptchaToken(null); // Reset reCAPTCHA token after submission

    router.push('/auth/user/signup/details');
   
  }

  function onRecaptchaChange(token: string | null) {
    setRecaptchaToken(token);
    if (error && token) setError(null); // Clear error if captcha is completed
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-linear-to-r  from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src={signupImage}
            alt="Signup image"
            className="absolute inset-0 w-full h-full object-cover "
            priority
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 md:p-12 ">
          <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl sm:text-3xl mb-3 font-bold text-black  font-custom">Sign Up</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom">
                Already have an account?
                <Link href="/auth/user/signin" className="font-medium text-sky-400 ml-1">
                  Sign In
                </Link>
              </p>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
            
              <div>
                <label htmlFor="emailInput" className="block mb-1 text-md font-semibold font-custom">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="emailInput"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="passwordInput" className="block mb-1 text-md font-semibold font-custom">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="passwordInput"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                    placeholder="Enter your password"
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
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPasswordInput"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                    placeholder="Confirm your password"
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
              {/* ReCAPTCHA */}
              <div className="mt-4 w-full flex justify-start items-center bg-gray-50 p-2 rounded-lg">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                  onChange={onRecaptchaChange}
                  theme='light'
                  
                />
              </div>
              <div className="flex items-start justify-center text-sm">
                <label className="flex items-center justify-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-600 dark:text-gray-400 font-custom mt-1 ">
                    By creating an account, you agree to our terms, conditions & policies.
                  </span>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={!recaptchaToken || !formData.email || !formData.password || !formData.confirmPassword}
                className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed "
              >
                Continue with Email
              </button>
              
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
                <span>Signup with Google</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
