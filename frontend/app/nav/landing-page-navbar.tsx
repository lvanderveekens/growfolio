"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiOutlineStock } from "react-icons/ai";
import { RxHamburgerMenu } from "react-icons/rx";
import { Button } from "../button";

interface LandingPageNavbarProps {
}

export const LandingPageNavbar: React.FC<LandingPageNavbarProps> = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="sticky top-0 z-50 bg-green-400 text-white px-4 w-full lg:flex lg:items-center font-bold gap-8">
      <div className="flex justify-between items-center w-full sm:w-auto">
        <div className="text-3xl py-4">
          <Link href="/">
            <AiOutlineStock size={40} className="inline mr-1" />
            growfolio
          </Link>
        </div>
        <div className="sm:hidden">
          <RxHamburgerMenu size={32} onClick={toggleNavbar} />
        </div>
      </div>

      {/* desktop */}
      <div className="hidden md:flex flex-grow text-xl justify-between items-center">
        <div className="flex gap-8">
          <Link href="#why" className="hover:text-black">
            Why
          </Link>
          <Link href="#pricing" className="hover:text-black">
            Pricing
          </Link>
          <Link href="#contact" className="hover:text-black">
            Contact
          </Link>
        </div>

        <div>
          <Button
            className={`font-bold px-8`}
            variant="tertiary"
            onClick={() => {
              router.push("/login");
            }}
          >
            Log in
          </Button>
        </div>
      </div>

      {/* mobile */}
      <div className={`${isOpen ? "block" : "hidden"} py-4 text-lg md:hidden`}>
        <div className="flex flex-col gap-2">
          <div className="">
            <Link
              className={`hover:text-green-400`}
              href="#why"
              onClick={toggleNavbar}
            >
              Why
            </Link>
          </div>
          <div className="">
            <Link
              className={`hover:text-green-400`}
              href="#pricing"
              onClick={toggleNavbar}
            >
              Pricing
            </Link>
          </div>
          <div className="">
            <Link
              className={`hover:text-green-400`}
              href="#contact"
              onClick={toggleNavbar}
            >
              Contact
            </Link>
          </div>
          <div className="">
            <Button
              className={`w-full`}
              variant="tertiary"
              onClick={() => {
                router.push("/login");
              }}
            >
              Log in
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};