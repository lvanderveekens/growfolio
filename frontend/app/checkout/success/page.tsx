
"use client"

import AppLayout from "@/app/app-layout";
import "chartjs-adapter-moment";
import Link from "next/link";
import { IoCheckmarkCircleOutline } from "react-icons/io5";

export default function CheckoutSuccessPage() {

  return (
    <AppLayout>
      <div className="container my-4">
        <div className="mt-8 mb-12 flex justify-center lg:justify-start">
          <IoCheckmarkCircleOutline className="text-green-400" size={96} />
        </div>
        <div className="mb-4 font-bold text-2xl">
          Thank you for your purchase!
        </div>
        <div className="mb-4">Enjoy your Premium subscription!</div>
        <div className="mb-4">
          Know that you can manage your subscription any time from the profile
          page.
        </div>
        <button className="w-full lg:w-auto mb-2 border px-3 py-2 mr-4">
          <Link href="/">Go to Overview</Link>
        </button>
      </div>
    </AppLayout>
  );
}