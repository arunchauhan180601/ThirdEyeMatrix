'use client'

import { useState } from 'react'
import Image from 'next/image'
import signupImage from "../../../../../../assets/images/Sign up-rafiki.png"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DetailsPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    howDidYouHear: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Details Submitted:', formData)

    // Save data to local storage
    localStorage.setItem('signupFirstName', formData.firstName);
    localStorage.setItem('signupLastName', formData.lastName);
    localStorage.setItem('signupPhoneNumber', formData.phoneNumber);
    localStorage.setItem('signupHowDidYouHear', formData.howDidYouHear);

    router.push('/auth/user/signup/business');
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-linear-to-r  from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src={signupImage}
            alt="Signup details image"
            className="absolute inset-0 w-full h-full object-cover "
            loading="lazy"
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 md:p-12 ">
          <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
            <div className="mb-8 mt-2 text-center">
              <h1 className="text-3xl sm:text-3xl mb-3  font-medium text-black  font-custom">ThirdEyeMatrix</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstNameInput" className="block mb-1 text-md font-semibold font-custom">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstNameInput"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 font-custom rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastNameInput" className="block mb-1 text-md font-semibold font-custom">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastNameInput"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phoneNumberInput" className="block mb-1 text-md font-semibold font-custom">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="phoneNumberInput"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label htmlFor="howDidYouHearSelect" className="block mb-1 text-md font-semibold font-custom">
                  How did you hear about us?
                </label>
                <select
                  id="howDidYouHearSelect"
                  name="howDidYouHear"
                  value={formData.howDidYouHear}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an option</option>
                  <option value="social_media">Social Media</option>
                  <option value="friend">Friend/Colleague</option>
                  <option value="search_engine">Search Engine</option>
                  <option value="advertisement">Online Advertisement</option>
                  <option value="event">Event/Webinar</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.howDidYouHear}
                className="w-full py-2 mt-1 cursor-pointer font-semibold  text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
              
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}