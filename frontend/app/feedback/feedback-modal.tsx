"use client"

import { useState } from "react";
import Modal from "../modal";

interface FeedbackModalProps {
  onSubmit: (text: any) => Promise<any>
  onClose: () => void
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({onSubmit, onClose}) => {
  const [text, setText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (event: any) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitted(false);
    setErrorMessage("")

    onSubmit(text)
      .then(() => {
        setSubmitted(true);
      })
      .catch((err) => {
        console.error(err)
        setErrorMessage("Something went wrong...");
      });

    setText("")
    setSubmitting(false);
  };

  return (
    <Modal title="Submit feedback" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-4">
          <label>
            <div className="mb-4">Do you have any suggestions?</div>
            <textarea
              className="w-full border resize-none h-auto"
              placeholder="Enter your suggestions"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              required
            />
          </label>
        </div>
        <button type="submit" className="border" disabled={submitting}>
          Submit
        </button>
      </form>
      {submitted && <div className="mt-4">Thanks for your feedback! 😀</div>}
      {errorMessage && <div className="mt-4 text-red-500">{errorMessage}</div>}
    </Modal>
  );
};