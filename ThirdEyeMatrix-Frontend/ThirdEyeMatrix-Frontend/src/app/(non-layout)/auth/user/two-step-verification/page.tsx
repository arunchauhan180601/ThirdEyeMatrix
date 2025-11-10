'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import otpImage from "../../../../../assets/images/EnterOtpImage.png"
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';


export default function OtpPage() {
  // const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false); // Add loading state
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', ''])
  const router = useRouter();
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

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

  function onRecaptchaChange(token: string | null) {
    setRecaptchaToken(token);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const code = otpValues.join('')
    if (code.length !== 4) {
      toast.error('Please enter the 4-digit code', {
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '10px',
        },
      });
      return
    }

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

    setLoading(true);

    try {
      const email = localStorage.getItem("userEmailForReset");
      if (!email) {
        toast.error("Email not found. Please go back to the forgot password page.", {
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

      const response = await fetch('http://localhost:5000/api/user/auth/verifyOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuthToken}`,
        },
        body: JSON.stringify({
          email,
          otp: code,
          captcha: recaptchaToken, // Include recaptchaToken as 'captcha'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "OTP verified successfully!", {
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '10px',
          },
        });
        localStorage.setItem("user_Id", data.user_Id); // Save user_Id to localStorage
        router.push("/auth/user/reset-password");
        return;
      } else {
        if (response.status === 400) {
          toast.error(data.message || 'Invalid or expired OTP', {
            style: {
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '10px',
            },
          });
          return;
        } else {
          toast.error(data.message || 'OTP verification failed', {
            style: {
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '10px',
            },
          });
        }
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
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
      setOtpValues(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-linear-to-r  from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src={otpImage}
            alt="OTP image banner"
            className="absolute inset-0 w-full h-full img-fluid"
            loading="lazy"
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 md:p-12">
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
              {/* ReCAPTCHA */}
              <div className="mt-4 w-full flex justify-center items-center bg-[#f9f9f9] p-2 rounded-lg">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                  onChange={onRecaptchaChange}
                />
              </div>
              <button
                type="submit"
                disabled={!recaptchaToken || otpValues.join('').length !== 4}
                className={`w-full py-2 mt-1 font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md 
                    ${
                      recaptchaToken && otpValues.join('').length === 4
                      ? "cursor-pointer bg-[#37B5FF] hover:opacity-90"
                      : "cursor-not-allowed bg-[#37b6ff9c]"
                    }`}
              >
                Verify OTP
              </button>
            </form>
          </div>
        </div>
      </div>
  
    </div>
  )
}


