
"use client"

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AiOutlineStock } from "react-icons/ai";
import { Button } from '../button';

export default function LoginPage({ params, }: { params: { provider: string } }) {
  const router = useRouter();

  return (
    <div className="">
      <div className='container flex justify-center items-center min-h-screen '>
        <div className="bg-white rounded-md border w-full lg:w-[400px]">
          <div className="px-4 lg:px-8 py-8 text-4xl text-green-400 font-bold text-center border-b-[1px]">
            <AiOutlineStock size={48} className="inline mr-1" />
            growfolio
          </div>
          <div className="px-4 lg:px-8 py-8">
            <div className="text-xl text-center font-bold pb-8">Login</div>
            <Button
              className="w-full px-4 py-4"
              variant='secondary'
              onClick={() => {
                router.push("/api/auth/google");
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
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
