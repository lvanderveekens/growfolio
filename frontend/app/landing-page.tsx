"use client";

import "chartjs-adapter-moment";
import { LandingPageNavbar } from "./nav/landing-page-navbar";
import { useState } from "react";
import { api } from "./axios";
import { useRouter } from "next/navigation";
import Footer from "./footer";
import { Button } from "./button";
import { FcCheckmark } from "react-icons/fc";

export interface SendContactMessageRequest {
  name: string;
  email: string;
  message: string;
}

export default function LandingPage() {
  const router = useRouter()

  const [contactName, setContactName] = useState<string>();
  const [contactEmail, setContactEmail] = useState<string>();
  const [contactMessage, setContactMessage] = useState<string>();
  const [contactSubmitting, setContactSubmitting] = useState<boolean>(false);

  const [contactSuccessMessage, setContactSuccessMessage] = useState<string>();
  const [contactErrorMessage, setContactErrorMessage] = useState<string>();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true)
    setContactSuccessMessage(undefined);
    setContactErrorMessage(undefined);

    const req: SendContactMessageRequest = {
      name: contactName!,
      email: contactEmail!,
      message: contactMessage!,
    };

    api
      .post("/contact", req, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        setContactSuccessMessage("Your message has been received!");
      })
      .catch((err) => {
        setContactErrorMessage("Something went wrong... Please try again later.");
      })
      .finally(() => {
        setContactName(undefined);
        setContactEmail(undefined);
        setContactMessage(undefined);
        setContactSubmitting(false);
      });
  };

  const redirectToLogin = () => {
    router.push("/login")
  }

  return (
    <div>
      <LandingPageNavbar />

      {/* hero */}
      <div className="w-full">
        <div className="mx-auto py-[120px] lg:py-[150px] relative">
          <div className="absolute z-[-1] top-0 left-0 w-full h-full bg-[url('/hero-background.png')] bg-center blur-md"></div>
          <div className="container">
            <div className="w-full lg:w-2/4 mx-auto">
              <div className="text-4xl lg:text-5xl font-bold mb-8">
                Watch your investment portfolio grow.
              </div>
              <div className="text-xl lg:text-2xl mb-8">
                Growfolio is an investment tracking app that helps you monitor
                and manage your portfolio's growth and performance.
              </div>
              <Button
                className="w-full lg:w-auto px-8 py-4 mb-8 font-bold text-lg lg:text-2xl"
                variant="primary"
                onClick={redirectToLogin}
              >
                Get Started for Free
              </Button>
              <div>No credit card required.</div>
            </div>
          </div>
        </div>
      </div>

      {/* why section */}
      <div id="why" className="scroll-mt-[50px] py-[50px] lg:py-[100px] bg-white">
        <div className="container">
          <h2 className="text-2xl lg:text-4xl font-bold text-center mb-[50px] lg:mb-[100px]">
            Why Growfolio?
          </h2>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5">
              <div className="text-xl lg:text-3xl font-bold mb-8">
                All investments in one place.
              </div>
              <div className="text-lg lg:text-2xl">
                Have all your investments, be it stocks, bonds,
                cryptocurrencies, or any asset, neatly organized in one place.
                No more flipping between apps to get the big picture.
              </div>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <img
                src="/why-1.png"
                className="mx-auto w-auto max-w-full max-h-[550px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center mt-[50px] lg:mt-[100px]">
            <div className="order-2 lg:order-none lg:col-span-6">
              <img
                src="/why-2.png"
                className="mx-auto w-auto max-w-full max-h-[550px]"
              />
            </div>
            <div className="order-1 lg:order-none lg:col-span-5 lg:col-start-8">
              <div className="text-xl lg:text-3xl font-bold mb-8">
                Visualize your portfolio growth.
              </div>
              <div className="text-lg lg:text-2xl">
                Charts and graphs make it easy to understand your portfolio's
                performance at a glance. No more deciphering endless rows and
                columns of numbers.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center mt-[50px] lg:mt-[100px]">
            <div className="lg:col-span-5">
              <div className="text-xl lg:text-3xl font-bold mb-8">
                Mobile-friendly.
              </div>
              <div className="text-lg lg:text-2xl">
                Access your investment data anytime, anywhere, right from your
                smartphone. Stay informed about your portfolio's performance,
                even when you're on the move.
              </div>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <img
                src="/why-3.png"
                className="mx-auto w-auto max-w-full max-h-[550px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center mt-[50px] lg:mt-[100px]">
            <div className="order-2 lg:order-none lg:col-span-6">
              <img
                src="/why-4.jpeg"
                className="mx-auto w-auto max-w-full max-h-[550px]"
              />
            </div>
            <div className="order-1 lg:order-none lg:col-span-5 lg:col-start-8">
              <div className="text-xl lg:text-3xl font-bold mb-8">
                By an investor, for investors.
              </div>
              <div className="text-lg lg:text-2xl">
                Benefit from a platform developed by an active investor who
                understands your needs and priorities firsthand.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* pricing section */}
      <div id="pricing" className="scroll-mt-[50px] py-[50px] lg:py-[100px]">
        <div className="container">
          <h2 className="text-2xl lg:text-4xl font-bold text-center mb-[50px] lg:mb-[100px]">
            Pricing
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[50px] lg:gap-[100px] lg:text-2xl">
            <div className="shadow-lg flex flex-col rounded-3xl border border border-1 bg-white px-[50px] py-[50px] lg:py-[100px]">
              <div className="text-2xl lg:text-3xl font-bold text-center mb-[50px]">
                Basic
              </div>
              <div className="text-4xl lg:text-6xl font-bold text-center mb-[50px] lg:mb-[100px]">
                $0
              </div>
              <div className="mb-[50px]">
                This includes:
                <div>
                  <FcCheckmark className="inline-block" /> Track 2 investments
                </div>
                <div>
                  <FcCheckmark className="inline-block" /> Performance charts
                </div>
                <div>
                  <FcCheckmark className="inline-block" /> Allocation charts
                </div>
                <div>
                  <FcCheckmark className="inline-block" /> CSV imports
                </div>
                <div>
                  <FcCheckmark className="inline-block" /> Support
                </div>
              </div>
              <div className="text-center">
                <Button
                  className="px-8 py-4 font-bold lg:text-2xl"
                  variant="primary"
                  onClick={redirectToLogin}
                >
                  Sign up
                </Button>
              </div>
            </div>

            <div className="shadow-lg flex flex-col rounded-3xl border border border-1 bg-white px-[50px] py-[50px] lg:py-[100px]">
              <div className="text-2xl lg:text-3xl font-bold text-center mb-[50px]">
                Premium
              </div>
              <div className="text-4xl lg:text-6xl font-bold text-center mb-[50px] lg:mb-[100px]">
                $4.99/mo
              </div>
              <div className="mb-[50px]">
                This includes:
                <div>
                  <FcCheckmark className="inline-block" /> Everything in Basic
                </div>
                <div>
                  <FcCheckmark className="inline-block" /> Track unlimited
                  investments
                </div>
              </div>
              <div className="text-center mt-auto">
                <Button
                  className="px-8 py-4 font-bold lg:text-2xl"
                  variant="primary"
                  onClick={redirectToLogin}
                >
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* contact section */}
      <div id="contact" className="scroll-mt-[50px] py-[50px] lg:py-[100px] bg-white">
        <h2 className="text-2xl lg:text-4xl font-bold text-center mb-[50px] lg:mb-[100px]">
          Contact
        </h2>
        <div className="container lg:text-2xl ">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[50px] lg:gap-[100px]">
            <div className="relative">
              <img
                src="/contact.jpeg"
                className="aspect-square lg:aspect-auto lg:absolute lg:w-full lg:h-full object-cover"
              />
            </div>
            <div>
              <form className="flex flex-col" onSubmit={handleFormSubmit}>
                <label className="">
                  <div className="mb-4">Name</div>
                  <input
                    className="border border-black w-full mb-4 lg:mb-[50px]"
                    type="text"
                    value={contactName || ""}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </label>
                <label className="">
                  <div className="mb-4">Email</div>
                  <input
                    className="border border-black w-full mb-4 lg:mb-[50px]"
                    type="email"
                    value={contactEmail || ""}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="">
                  <div className="mb-4">Message</div>
                  <textarea
                    className="border border-black w-full mb-4 lg:mb-[50px] resize-none"
                    rows={8}
                    value={contactMessage || ""}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </label>
                <Button
                  type="submit"
                  variant="primary"
                  className="px-8 py-4 font-bold"
                  disabled={contactSubmitting}
                >
                  {contactSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <span>Send</span>
                  )}
                </Button>
              </form>
            </div>
          </div>
          {contactSuccessMessage && (
            <div className="text-center mt-[50px] lg:mt-[100px] ">
              {contactSuccessMessage}
            </div>
          )}
          {contactErrorMessage && (
            <div className="text-center mt-[50px] lg:mt-[100px] text-red-500">
              {contactErrorMessage}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
