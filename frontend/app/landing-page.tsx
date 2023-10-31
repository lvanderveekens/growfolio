"use client";

import "chartjs-adapter-moment";
import { LandingPageNavbar } from "./nav/landing-page-navbar";

export default function LandingPage() {
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

        <div className="container">
          {/* why section */}
          <div id="why" className="py-[100px]">
            <h2 className="text-4xl font-bold text-center">Why Growfolio?</h2>

            <div className="grid grid-cols-12 py-[100px] items-center">
              <div className="col-span-5">
                <div className="text-4xl font-bold mb-8">
                  All investments in one place.
                </div>
                <div className="text-2xl">
                  Have all your investments, be it stocks, bonds,
                  cryptocurrencies, or any asset, neatly organized in one place.
                  No more flipping between apps to get the big picture.
                </div>
              </div>
              <div className="col-start-7 col-span-6">
                <img src="/why-1.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
              </div>
            </div>

            <div className="grid grid-cols-12 py-[100px] items-center">
              <div className="col-span-6">
                <img src="/why-2.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
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

            <div className="grid grid-cols-12 py-[100px] items-center">
              <div className="col-span-5">
                <div className="text-4xl font-bold mb-8">Mobile-friendly.</div>
                <div className="text-2xl">
                  Access your investment data anytime, anywhere, right from your
                  smartphone. Stay informed about your portfolio's performance,
                  even when you're on the move.
                </div>
              </div>
              <div className="col-start-7 col-span-6">
                <img src="/why-3.png" className="mx-auto w-auto max-w-full max-h-[550px]" />
              </div>
            </div>
          </div>

          {/* pricing section */}
          <div id="pricing" className="py-[100px]">
            <h2 className="text-4xl font-bold text-center">Pricing</h2>
          </div>

          {/* contact section */}
          <div id="contact" className="py-[100px]">
            <h2 className="text-4xl font-bold text-center">Contact</h2>
          </div>
        </div>

        {/* footer */}
        <div className="bg-black text-white text-2xl py-8 text-center">
          © 2023 Growfolio
        </div>
      </div>
    );
}
