
"use client"

import { Navbar } from "@/app/navbar";
import "chartjs-adapter-moment";
import Link from "next/link";
import { IoCheckmarkCircleOutline } from "react-icons/io5";

export default function CheckoutSuccessPage() {

  return (
    <>
      <Navbar />
      <div className="p-4">
        <div className="mt-8 mb-12 flex justify-center">
          <IoCheckmarkCircleOutline className="text-green-400" size={64} />
        </div>
        <div className="mb-4 font-bold text-2xl">
          Thank you for your purchase!
        </div>
        <div className="mb-4">
          Enjoy your Premium subscription!
        </div>
        <div className="mb-4">
          Know that you can manage your subscription any time from the profile page.
        </div>
        <div className="mb-4">
          <Link href="/" className="block border px-3 py-2 w-full text-center">Go to Overview</Link>
        </div>
      </div>
    </>
  );
}