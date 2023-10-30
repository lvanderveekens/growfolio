"use client";

import "chartjs-adapter-moment";
import Image from 'next/image';
import { LandingPageNavbar } from "./nav/landing-page-navbar";

export default function LandingPage() {
    return (
      <div>
        <LandingPageNavbar />
        <div className="w-full">
          {/* <img
            className="w-full blur-md h-[100px]"
            src="/hero-background.png"
            alt="Hero background"
          /> */}
          <div className="mx-auto py-[200px] relative">
            <div className="absolute z-[-1] top-0 left-0 w-full h-full bg-[url('/hero-background.png')] bg-center blur-md"></div>
            <div className="text-6xl font-bold">Watch your investment portfolio grow.</div>
          </div>
        </div>
      </div>
    );
}
