import React from "react";

const InviteMemberPage = () => {
  return (
    <>
      <div className="font-custom min-h-[80vh]  flex flex-col justify-center items-center">
        <h1 className="font-semibold text-xl sm:text-3xl text-center">
          Add Team Members
        </h1>
        <p className="text-center my-3 text-gray-500 ">
          Easily collaborate by adding team members. Share insights, manage
          tasks, and automate your workflows.
        </p>
        <div className="p-6  lg:p-12 border rounded-md">
          <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <label
                htmlFor="inviteEmail"
                className="text-sm font-semibold whitespace-nowrap"
              >
                Email :{" "}
              </label>
              <input
                id="inviteEmail"
                type="email"
                placeholder="name@example.com"
                className="border rounded-md px-3 py-2 text-sm border-gray-400 focus:outline-none focus:border-none focus:ring-1 focus:ring-blue-600 w-full md:w-[26rem]"
              />
            </div>
            <select
              id="inviteRole"
              className="border border-gray-400 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-none focus:ring-1 focus:ring-blue-600 w-full sm:w-auto"
              defaultValue="user"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm w-full sm:w-auto"
            >
              Send Invite
            </button>
          </form>
          <div className="px-4 pt-4">
            <ul className="px-0">
              <li className="list-disc  text-gray-500 text-sm sm:text-md ">
                Admins can add or remove users, manage integrations, and upgrade
                plans.
              </li>
            </ul>
          </div> 
          </div>

         <div className="mt-12 mb-2 text-center">
          <button className="bg-[#1877f2] cursor-pointer hover:bg-blue-500 text-white font-bold py-2 px-5 sm:py-2 sm:px-8 rounded-md shadow-lg ">
            Next
          </button>
        </div>
      </div>
    
    </>
  );
};
export default InviteMemberPage;
