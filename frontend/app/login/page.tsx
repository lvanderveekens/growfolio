
"use client"

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { AiOutlineStock } from "react-icons/ai";
import Image from 'next/image';

export default function LoginPage({ params, }: { params: { provider: string } }) {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white border border-1 border-gray-300">
        <div className="p-8 text-4xl text-green-400 font-bold text-center border-b-[1px] border-gray-300">
          <AiOutlineStock size={48} className="inline mr-1" />
          growfolio
        </div>
        <div className="p-8">
          <div className="text-xl text-center font-bold pb-8">Login</div>
          <button
            className="border border-black p-4 rounded-md w-[400px]"
            onClick={() => {
              router.push("/api/v1/auth/google");
            }}
          >
            <div className="flex">
              <Image
                className="mr-4"
                src="/google-logo.svg"
                alt="Google logo"
                width={24}
                height={24}
              />
              Log in with Google
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
