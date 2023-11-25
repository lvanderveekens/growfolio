"use client"

import { useState } from "react";
import Modal from "../modal";
import { Button } from "../button";

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
        console.error(err);
        setErrorMessage("Something went wrong...");
      })
      .finally(() => {
        setText("");
        setSubmitting(false);
      });
  };

  return (
    <Modal title="Feedback" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-4">
          <label>
            <div className="mb-4">Share your thoughts with us!</div>
            <div className="mb-4">
              Whether it's feedback or feature requests, your input matters.
              Help us improve by letting us know what you think.
            </div>
            <div className="mb-4">Thank you!</div>
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
        <div>
          <Button
            className="w-full lg:w-auto ml-auto block"
            variant="primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? <span>Submitting...</span> : <span>Submit</span>}
          </Button>
        </div>
      </form>
      {submitted && <div className="mt-4">Thanks for your feedback! 😀</div>}
      {errorMessage && <div className="mt-4 text-red-500">{errorMessage}</div>}
    </Modal>
  );
};