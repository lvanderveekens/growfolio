"use client"

import React, { useEffect, useRef } from 'react';
import { FaXmark } from 'react-icons/fa6';

interface ModalProps {
  title: string
  onClose: () => void;
  children: any
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {

  const modalBackgroundRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalBackgroundRef.current && modalBackgroundRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  return (
    <div className={`z-50 fixed inset-0 flex items-center justify-center`}>
      <div ref={modalBackgroundRef} className="fixed inset-0 bg-black opacity-50"></div>
      <div className="bg-white rounded m-4 p-4 lg:m-8 lg:p-8 w-full lg:w-[500px] z-10">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-lg font-bold">{title}</span>
          <FaXmark
            className="hover:cursor-pointer"
            size={24}
            onClick={onClose}
          />
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;