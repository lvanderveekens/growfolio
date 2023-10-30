"use client"

import { useState } from "react";
import { RiFeedbackLine } from "react-icons/ri";
import { api } from "../axios";
import { FeedbackModal } from "./feedback-modal";

interface SubmitFeedbackRequest {
  text: string
  pageUrl: string
}

interface FeedbackButtonProps {
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = () => {
  const [showModal, setShowModal] = useState<boolean>(false)

  const handleClick = (event: any) => {
    event.stopPropagation();
    setShowModal(!showModal);
  };

  const handleSubmit = (text: string) => {
    const request: SubmitFeedbackRequest = {
      text: text,
      pageUrl: window.location.pathname,
    };

    return api.post(`/feedback`, request)
  };

  return (
    <div>
      {showModal && <FeedbackModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
      <button
        className="fixed bottom-4 right-4 bg-green-400 text-white py-2 px-4 rounded-full shadow-lg z-50"
        onClick={handleClick}
      >
        <RiFeedbackLine size={32} />
      </button>
    </div>
  );
};