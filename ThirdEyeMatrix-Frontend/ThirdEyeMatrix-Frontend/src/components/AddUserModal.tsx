"use client";

import { AddUserData, createUser } from "@/api/user/createUser";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react"; // Added for password visibility toggle
import { getRoles, RoleData } from "@/api/role/getRoles";
import { ChevronDown } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void; // Callback to refresh user list
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [formData, setFormData] = useState<AddUserData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role_id: 0, // Initialize role_id field as number
  });

  const [showPassword, setShowPassword] = useState(false); // Add state for password visibility
  const [roles, setRoles] = useState<RoleData[]>([]); // State for roles
  const [showRoleDropdown, setShowRoleDropdown] = useState(false); // State for custom role dropdown visibility

  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const fetchedRoles = await getRoles(token);
        setRoles(fetchedRoles);
        if (fetchedRoles.length > 0) {
          setFormData((prev) => ({
            ...prev,
            role_id: Number(fetchedRoles[0].id), // Ensure role_id is a number
          }));
        }
      } else {
        console.warn("No authentication token found. Cannot fetch roles.");
      }
    };

    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "role_id" ? Number(value) : value, // Convert role_id to number
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token =
      localStorage.getItem("token");

    if (!token) {
      console.error("No authentication token found.");
      toast.error("Authentication required to add a user.");
      return;
    }

    try {
      const data = await createUser(formData, token);
      console.log(data);

      toast.success("User Added Successfully", {
        style: {
        fontSize: "16px",
        fontWeight: "bold",
        borderRadius: "10px",
        } });

      onClose(); // Close modal on success
      onUserAdded(); // Notify parent to refresh list
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role_id: roles.length > 0 ? Number(roles[0].id) : 0, // Reset role_id to default number
      });
    } catch (error) {
      console.error("Failed to add user:", error);
      if (Array.isArray(error)) {
        error.forEach((msg) => toast.error(msg, {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
            }
        }));
      } else {
        toast.error(`Failed to add user: ${(error as Error).message}` , {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
            }
        });
      }
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl dark:bg-dark-900">
            <button
              className="absolute top-2 right-4 text-gray-600 hover:text-gray-900 text-3xl cursor-pointer"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-3xl sm:text-3xl font-bold text-black font-custom mb-2 text-center">
              Add New User
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom text-center mb-6">
              Please fill in the user details
            </p>
            <form className="font-custom" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block mb-1 text-md font-semibold font-custom"
                  >
                    First Name:
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    placeholder="Enter First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block mb-1 text-md font-semibold font-custom"
                  >
                    Last Name:
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    placeholder="Enter Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  placeholder="Enter Email"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    placeholder="Enter Password"
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 flex items-center text-gray-500 ltr:right-3 rtl:left-3"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5"/>
                    ) : (
                      <EyeOff className="w-5 h-5"/>
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="roles"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Role:
                </label>
                <div className="relative">
                  <div
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none cursor-pointer flex justify-between items-center"
                    onClick={() => setShowRoleDropdown((prev) => !prev)}
                  >
                    {roles.find((role) => Number(role.id) === formData.role_id)?.name ||
                      "Select a role"}
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showRoleDropdown ? "rotate-180" : ""}`}
                    />
                  </div>
                  {showRoleDropdown && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto dark:bg-dark-800">
                      {roles.map((role) => (
                        <li
                          key={role.id}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-dark-700 ${Number(role.id) === formData.role_id ? "bg-gray-0 dark:bg-dark-600" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, role_id: Number(role.id) })); // Ensure role_id is a number
                            setShowRoleDropdown(false);
                          }}
                        >
                          {role.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

             
              <div className="flex items-center justify-between mt-5 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 cursor-pointer font-semibold text-gray-700 font-custom transition-all duration-200 rounded-lg shadow-md bg-gray-200 hover:opacity-90"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddUserModal;
