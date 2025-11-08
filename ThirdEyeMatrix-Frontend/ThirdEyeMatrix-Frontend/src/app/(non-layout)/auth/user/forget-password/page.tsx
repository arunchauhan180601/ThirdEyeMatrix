"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import forgetPasswordImage from "../../../../../assets/images/ForgotPasswordImage.png";
import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ForgetPasswordPage() {
  // const [error, setError] = useState<string | null>(null)
  const [, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function onRecaptchaChange(token: string | null) {
    setRecaptchaToken(token);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA", {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
      return;
    }

    setLoading(true);

    try {
      const basicAuthToken = btoa(
        `${process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME}:${process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD}`
      );

      const response = await fetch(
        "http://localhost:5000/api/user/auth/sendOtp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${basicAuthToken}`,
          },
          body: JSON.stringify({
            email: formData.email,
            captcha: recaptchaToken,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "OTP sent to your email!", {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
        localStorage.setItem("userEmailForReset", formData.email);
        router.push("/auth/user/two-step-verification");
      } else {
        toast.error(data.message || "Failed to send OTP", {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
    } finally {
      setLoading(false);
      setFormData({ email: "" });
      setRecaptchaToken(null);
    }
    5;
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r  from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src={forgetPasswordImage}
            alt="Forget password image banner"
            className="absolute inset-0 w-full h-full img-fluid "
            priority
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 md:p-12">
          <div className="w-full sm:max-w-md md:max-w-lg lg:max-w-md bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl mb-3 font-bold text-black  font-custom">
                Forgot Password
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom">
                Enter your email or username to reset it.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="emailInput"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Email
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
              {/* ReCAPTCHA */}
              <div className="mt-4 w-full flex justify-center items-center bg-[#f9f9f9] p-2 rounded-lg">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                  onChange={onRecaptchaChange}
                />
              </div>
              <button
                type="submit"
                disabled={!recaptchaToken && !formData.email}
                className={`w-full py-2 mt-1 font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md 
                    ${
                      recaptchaToken && formData.email
                      ? "cursor-pointer bg-[#37B5FF] hover:opacity-90"
                      : "cursor-not-allowed bg-[#37b6ff9c]"
                    }`}
              >
                Send OTP
              </button>

              <div className="text-center ">
                <span className="font-custom">Return To the </span>
                <Link
                  href="/auth/user/signin"
                  className="text-sky-400 font-medium font-custom"
                >
                  Sign In{" "}
                  <MoveRight className="inline-block rtl:mr-1 ltr:ml-1 size-5" />
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
