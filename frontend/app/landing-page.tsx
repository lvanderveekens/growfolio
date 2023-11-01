"use client";

import "chartjs-adapter-moment";
import { LandingPageNavbar } from "./nav/landing-page-navbar";
import { useState } from "react";
import { api } from "./axios";

export interface SendContactMessageRequest {
  name: string;
  email: string;
  message: string;
}

export default function LandingPage() {
  const [contactName, setContactName] = useState<string>();
  const [contactEmail, setContactEmail] = useState<string>();
  const [contactMessage, setContactMessage] = useState<string>();

  const [contactSuccessMessage, setContactSuccessMessage] = useState<string>();
  const [contactErrorMessage, setContactErrorMessage] = useState<string>();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      });
  };

  return (
    <div>
      <LandingPageNavbar />

      {/* hero */}
      <div className="w-full">
        <div className="mx-auto py-[177px] relative">
          <div className="absolute z-[-1] top-0 left-0 w-full h-full bg-[url('/hero-background.png')] bg-center blur-md"></div>
          <div className="container grid">
            <div className="w-2/4 mx-auto">
              <div className="text-6xl font-bold mb-8">
                Watch your investment portfolio grow.
              </div>
              <div className="text-2xl mb-8">
                Growfolio is an investment tracking app that helps you monitor
                and manage your portfolio's growth and performance.
              </div>
              <button className="px-8 py-4 mb-8 bg-green-400 font-bold text-white text-2xl">
                Get Started for Free
              </button>
              <div>No credit card required.</div>
            </div>
          </div>
        </div>
      </div>

      {/* why section */}
      <div id="why" className="container py-[100px]">
        <h2 className="text-4xl font-bold text-center mb-[100px]">
          Why Growfolio?
        </h2>

        <div className="grid grid-cols-12 items-center">
          <div className="col-span-5">
            <div className="text-4xl font-bold mb-8">
              All investments in one place.
            </div>
            <div className="text-2xl">
              Have all your investments, be it stocks, bonds, cryptocurrencies,
              or any asset, neatly organized in one place. No more flipping
              between apps to get the big picture.
            </div>
          </div>
          <div className="col-start-7 col-span-6">
            <img
              src="/why-1.png"
              className="mx-auto w-auto max-w-full max-h-[550px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 mt-[100px] items-center">
          <div className="col-span-6">
            <img
              src="/why-2.png"
              className="mx-auto w-auto max-w-full max-h-[550px]"
            />
          </div>
          <div className="col-span-5 col-start-8">
            <div className="text-4xl font-bold mb-8">
              Visualize your portfolio growth.
            </div>
            <div className="text-2xl">
              Charts and graphs make it easy to understand your portfolio's
              performance at a glance. No more deciphering endless rows and
              columns of numbers.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 mt-[100px] items-center">
          <div className="col-span-5">
            <div className="text-4xl font-bold mb-8">Mobile-friendly.</div>
            <div className="text-2xl">
              Access your investment data anytime, anywhere, right from your
              smartphone. Stay informed about your portfolio's performance, even
              when you're on the move.
            </div>
          </div>
          <div className="col-start-7 col-span-6">
            <img
              src="/why-3.png"
              className="mx-auto w-auto max-w-full max-h-[550px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 mt-[100px] items-center">
          <div className="col-span-6">
            <img
              src="/why-4.jpeg"
              className="mx-auto w-auto max-w-full max-h-[550px]"
            />
          </div>
          <div className="col-span-5 col-start-8">
            <div className="text-4xl font-bold mb-8">
              By an investor, for investors.
            </div>
            <div className="text-2xl">
              Benefit from a platform developed by an active investor who
              understands your needs and priorities firsthand.
            </div>
          </div>
        </div>
      </div>

      {/* pricing section */}
      <div id="pricing" className="py-[100px] bg-[#F7F7F7]">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-[100px]">Pricing</h2>

          <div className="grid grid-cols-2 gap-[100px] text-2xl">
            <div className="flex flex-col rounded-3xl border border-black border-1 bg-white px-[50px] py-[100px]">
              <div className="text-4xl font-bold text-center mb-[50px]">
                Basic
              </div>
              <div className="text-6xl font-bold text-center mb-[100px]">
                $0
              </div>
              <div className="mb-[50px]">
                This includes:
                <ul className="list-disc list-inside">
                  <li>Track 2 investments</li>
                  <li>Performance charts</li>
                  <li>Allocation charts</li>
                  <li>CSV imports</li>
                  <li>Support</li>
                </ul>
              </div>
              <div className="text-center">
                <button className="px-8 py-4 bg-green-400 font-bold text-white text-2xl">
                  Sign up
                </button>
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-black border-1 bg-white px-[50px] py-[100px]">
              <div className="text-4xl font-bold text-center mb-[50px]">
                Premium
              </div>
              <div className="text-6xl font-bold text-center mb-[100px]">
                $4.99/mo
              </div>
              <div className="mb-[50px]">
                This includes:
                <ul className="list-disc list-inside">
                  <li>Everything in Basic</li>
                  <li>Track unlimited investments</li>
                </ul>
              </div>
              <div className="text-center mt-auto">
                <button className="px-8 py-4 bg-green-400 font-bold text-white text-2xl">
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* contact section */}
      <div id="contact" className="py-[100px]">
        <h2 className="text-4xl font-bold text-center mb-[100px]">Contact</h2>
        <div className="container text-2xl ">
          <div className="grid grid-cols-2 gap-[100px]">
            <div className="relative">
              <img
                src="/contact.jpeg"
                className="absolute w-full h-full object-cover"
              />
            </div>
            <div>
              <form
                className="flex flex-col"
                onSubmit={handleFormSubmit}
              >
                <label className="">
                  <div className="mb-4">Name</div>
                  <input
                    className="border border-black w-full mb-[50px]"
                    type="text"
                    value={contactName || ""}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </label>
                <label className="">
                  <div className="mb-4">Email</div>
                  <input
                    className="border border-black w-full mb-[50px]"
                    type="text"
                    value={contactEmail || ""}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="">
                  <div className="mb-4">Message</div>
                  <textarea
                    className="border border-black w-full mb-[50px] resize-none"
                    rows={8}
                    value={contactMessage || ""}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="px-8 py-4 bg-green-400 font-bold text-white"
                >
                  Send
                </button>
              </form>
              {contactSuccessMessage && (
                <div className="mt-[50px] ">
                  {contactSuccessMessage}
                </div>
              )}
              {contactErrorMessage && (
                <div className="mt-[50px] text-red-500">
                  {contactErrorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="bg-black text-white text-2xl py-8 text-center">
        © 2023 Growfolio
      </div>
    </div>
  );
}
