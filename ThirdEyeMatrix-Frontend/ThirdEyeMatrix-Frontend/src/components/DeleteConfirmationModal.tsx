"use client"

import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl dark:bg-dark-900">
        <h2 className="text-xl sm:text-2xl font-bold text-black font-custom mb-4 text-center">
          Confirm Deletion
        </h2>
        <button
          className="absolute top-2 right-4 text-gray-600 hover:text-gray-900 text-3xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom text-center mb-6">
          Are you sure you want to delete user "{userName}"? 
        </p>
        <div className="flex items-center mt-6 justify-between space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 cursor-pointer font-semibold text-gray-700 font-custom transition-all duration-200 rounded-lg shadow-md bg-gray-200 hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-red-600 hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
