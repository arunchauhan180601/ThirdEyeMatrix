'use client'

import { useState } from 'react'
import Image from 'next/image'
import BookDemoImage from "../../../../../assets/images/demoPicture.png"
import Link from 'next/link'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyEmail: '',
    companyName: '',
    companyWebsite: '',
    phoneNumber: '',
    annualRevenue: '',
    ecommercePlatform: '',
    timezone: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setFormData((prev) => {
      return {
        ...prev,
        [name]: value,
      }
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form Data Submitted:', formData)
    // Add form submission logic here
  }

    return (
    <>  
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src={BookDemoImage}
            alt="Book a Demo image"
            className="absolute inset-0 w-full h-full img-fluid"
            loading="lazy"
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 md:p-12 ">
          <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide ">
            <div className="mb-2 ">
              <h2 className="text-xl sm:text-3xl mb-3 font-bold text-black font-custom">Tell us about your business</h2>
            </div>

             <div className="mb-6 ">
              <h3 className="text-md sm:text-sm mb-3 font-bold text-gray-400 font-custom">Get your zero-commitment demo to see our AI-native platform.</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 ">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border  border-gray-300 font-custom rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  placeholder="Last Name"
                />
              </div>
              <input
                type="email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                placeholder="Company Email"
              />
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                placeholder="Company Name"
              />
              <input
                type="url"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                placeholder="Company Website"
              />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                placeholder="Phone Number"
              />
              <div>
                <label htmlFor="annualRevenueSelect" className="block mb-1 text-md font-semibold font-custom">
                  What is your annual revenue ?
                </label>
                <select
                  id="annualRevenueSelect"
                  name="annualRevenue"
                  value={formData.annualRevenue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an option</option>
                  <option value="0-50k">Less than $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-500k">$100,000 - $500,000</option>
                  <option value="500k-1m">$500,000 - $1,000,000</option>
                  <option value="1m-5m">$1,000,000 - $5,000,000</option>
                  <option value="5m-10m">$5,000,000 - $10,000,000</option>
                  <option value="10m+">$10,000,000+</option>
                </select>
              </div>
              <div>
                <label htmlFor="ecommercePlatformSelect" className="block mb-1 text-md font-semibold font-custom">
                  What ecommerce platform do you use ?
                </label>
                <select
                  id="ecommercePlatformSelect"
                  name="ecommercePlatform"
                  value={formData.ecommercePlatform}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an option</option>
                  <option value="shopify">Shopify</option>
                  <option value="magento">Magento</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="bigcommerce">BigCommerce</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="timezoneSelect" className="block mb-1 text-md font-semibold font-custom">
                  Which timezone are you closest to? We'll pair you with a specialist near you.
                </label>
                <select
                  id="timezoneSelect"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an option</option>
                  <option value="EST">Eastern Standard Time (EST)</option>
                  <option value="CST">Central Standard Time (CST)</option>
                  <option value="MST">Mountain Standard Time (MST)</option>
                  <option value="PST">Pacific Standard Time (PST)</option>
                  <option value="GMT">Greenwich Mean Time (GMT)</option>
                  <option value="CET">Central European Time (CET)</option>
                  <option value="IST">Indian Standard Time (IST)</option>
                </select>
              </div>
              <Link href="/auth/user/signup">  
              <button
                type="submit"
                className="w-full py-2 mt-1 mb-2 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90"
              >
                Book a Demo
              </button>
              </Link>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer/>
    </div>
    </>  
    )
}