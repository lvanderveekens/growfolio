import React from 'react';
import { FaXmark } from 'react-icons/fa6';

interface ModalProps {
  title: string
  onClose: () => void;
  children: any
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className={`fixed inset-0 flex items-center justify-center`}>
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="bg-white rounded p-6 w-96 z-10">
        <div className="mb-4 flex justify-between items-center">
          <span className='text-lg font-bold'>{title}</span>
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