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
      {showModal && (
        <FeedbackModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
      <div className="fixed top-3/4 right-0 transform origin-bottom-left translate-x-full -rotate-90 z-20">
        <button className="text-white font-bold bg-green-400 hover:bg-green-500 rounded-t-lg px-4 py-2 " onClick={handleClick}>
          Feedback
        </button>
      </div>
    </div>
  );
};