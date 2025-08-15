import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  confirmButtonClass = 'bg-disa-red hover:bg-red-700',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-disa-accent-yellow" />
        <div className="mt-4 text-gray-600 dark:text-gray-300">{children}</div>
      </div>
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={onClose}
          className="px-6 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-6 py-2 font-semibold text-white transition-colors rounded-lg ${confirmButtonClass}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
