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

  const [liveDemoSubmitting, setLiveDemoSubmitting] = useState<boolean>(false);

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

  const createDemoSession = () => {
    setLiveDemoSubmitting(true);
    api
      .post("/demo-sessions")
      .then((res) => {
        window.location.reload();
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        // setLiveDemoSubmitting(false);
      });
  }

  return (
    <div>
      <LandingPageNavbar />

      {/* hero */}
      <div className="w-full">
        <div className="mx-auto py-[50px] lg:py-[150px] relative">
          <div className="absolute z-[-1] top-0 left-0 w-full h-full bg-[url('/hero-background.png')] bg-center blur-md"></div>
          <div className="container">
            <div className="w-full lg:w-2/4 mx-auto">
              <div className="text-4xl lg:text-5xl font-bold mb-8">Watch your investment portfolio grow.</div>
              <div className="text-xl lg:text-2xl mb-8">
                Growfolio lets you effortlessly manage and visualize the growth and performance
                of your long-term investments.
              </div>
              <div className="mb-8">
                <Button
                  className="w-full lg:w-auto mb-4 lg:mb-0 border-2 px-8 py-4 mr-4 font-bold text-lg lg:text-2xl"
                  variant="primary"
                  onClick={redirectToLogin}
                >
                  Get Started
                </Button>
                <Button
                  className="w-full lg:w-auto border-2 px-8 py-4 font-bold text-lg lg:text-2xl"
                  variant="quaternary"
                  onClick={createDemoSession}
                  disabled={liveDemoSubmitting}
                >
                  Live Demo
                </Button>
              </div>
              <div>* No credit card required.</div>
            </div>
          </div>
        </div>
      </div>

      {/* why section */}
      <div id="why" className="scroll-mt-[50px] py-[50px] lg:py-[100px] bg-white">
        <div className="container">
          <h2 className="text-2xl lg:text-4xl font-bold text-center mb-[50px] lg:mb-[100px]">Why Growfolio?</h2>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5">
              <div className="text-xl lg:text-3xl font-bold mb-8">All investments in one place</div>
              <div className="text-lg lg:text-2xl">
                Consolidate all your investments in one platform for a comprehensive overview. No more jumping between
                apps or spreadsheets.
              </div>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <img src="/why-1.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center mt-[50px] lg:mt-[100px]">
            <div className="order-2 lg:order-none lg:col-span-6">
              <img src="/why-2.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
            </div>
            <div className="order-1 lg:order-none lg:col-span-5 lg:col-start-8">
              <div className="text-xl lg:text-3xl font-bold mb-8">Visualize your success</div>
              <div className="text-lg lg:text-2xl">
                Use intuitive charts to visually track your financial journey, providing insights into your progress
                over time without the need for intricate manual calculations.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center mt-[50px] lg:mt-[100px]">
            <div className="lg:col-span-5">
              <div className="text-xl lg:text-3xl font-bold mb-8">Effortless updates</div>
              <div className="text-lg lg:text-2xl">
                Regularly update your investments, recording values, deposits, and withdrawals to maintain an accurate
                and up-to-date portfolio.
              </div>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <img src="/why-3.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center mt-[50px] lg:mt-[100px]">
            <div className="order-2 lg:order-none lg:col-span-6">
              <img src="/why-4.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
            </div>
            <div className="order-1 lg:order-none lg:col-span-5 lg:col-start-8">
              <div className="text-xl lg:text-3xl font-bold mb-8">CSV integration</div>
              <div className="text-lg lg:text-2xl">
                Already using a spreadsheet to track your portfolio? You can seamlessly import and export your
                investment updates using CSV files. No strings attached.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[50px] lg:gap-[100px] lg:gap-0 lg:grid-cols-12 items-center mt-[50px] lg:mt-[100px]">
            <div className="lg:col-span-5">
              <div className="text-xl lg:text-3xl font-bold mb-8">Tailored for long-term investors</div>
              <div className="text-lg lg:text-2xl">
                Created for long-term investors and those pursuing Financial Independence, Retire Early (FIRE), this
                platform is your dedicated companion on the path to strategic wealth-building.
              </div>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <img src="/why-5.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
            </div>
          </div>
        </div>
      </div>

      {/* pricing section */}
      <div id="pricing" className="scroll-mt-[50px] py-[50px] lg:py-[100px]">
        <div className="container">
          <h2 className="text-2xl lg:text-4xl font-bold text-center mb-[50px] lg:mb-[100px]">Pricing</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[50px] lg:gap-[100px] lg:text-2xl">
            <div className="shadow-lg flex flex-col rounded-3xl border border border-1 bg-white px-[50px] py-[50px] lg:py-[100px]">
              <div className="text-2xl lg:text-3xl font-bold text-center mb-[50px]">Basic</div>
              <div className="text-4xl lg:text-6xl font-bold text-center mb-[50px] lg:mb-[100px]">$0</div>
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
                  <FcCheckmark className="inline-block" /> CSV imports/exports
                </div>
                <div>
                  <FcCheckmark className="inline-block" /> Support
                </div>
              </div>
              <div className="text-center">
                <Button className="px-8 py-4 font-bold lg:text-2xl" variant="primary" onClick={redirectToLogin}>
                  Sign up
                </Button>
              </div>
            </div>

            <div className="shadow-lg flex flex-col rounded-3xl border border border-1 bg-white px-[50px] py-[50px] lg:py-[100px]">
              <div className="text-2xl lg:text-3xl font-bold text-center mb-[50px]">Premium</div>
              <div className="text-4xl lg:text-6xl font-bold text-center mb-[50px] lg:mb-[100px]">$4.99/mo</div>
              <div className="mb-[50px]">
                This includes:
                <div>
                  <FcCheckmark className="inline-block" /> Everything in Basic
                </div>
                <div>
                  <FcCheckmark className="inline-block" /> Track unlimited investments
                </div>
              </div>
              <div className="text-center mt-auto">
                <Button className="px-8 py-4 font-bold lg:text-2xl" variant="primary" onClick={redirectToLogin}>
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* contact section */}
      <div id="contact" className="scroll-mt-[50px] py-[50px] lg:py-[100px] bg-white">
        <h2 className="text-2xl lg:text-4xl font-bold text-center mb-[50px] lg:mb-[100px]">Contact</h2>
        <div className="container lg:text-xl ">
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
                  <div className="">Name</div>
                  <input
                    className="w-full mb-4 lg:mb-[50px]"
                    type="text"
                    value={contactName || ""}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </label>
                <label className="">
                  <div className="">Email</div>
                  <input
                    className="w-full mb-4 lg:mb-[50px]"
                    type="email"
                    value={contactEmail || ""}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="">
                  <div className="">Message</div>
                  <textarea
                    className="w-full mb-4 lg:mb-[50px] resize-none"
                    rows={8}
                    value={contactMessage || ""}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </label>
                <Button type="submit" variant="primary" className="px-8 py-4 font-bold" disabled={contactSubmitting}>
                  {contactSubmitting ? <span>Sending...</span> : <span>Send</span>}
                </Button>
              </form>
            </div>
          </div>
          {contactSuccessMessage && <div className="text-center mt-[50px] lg:mt-[100px] ">{contactSuccessMessage}</div>}
          {contactErrorMessage && (
            <div className="text-center mt-[50px] lg:mt-[100px] text-red-500">{contactErrorMessage}</div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
