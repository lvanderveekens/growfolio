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
    <nav className="sticky top-0 z-50 bg-green-400 lg:px-4 gap-4 text-white w-full lg:flex lg:items-center font-bold lg:h-[72px]">

      <div className="flex justify-between items-center w-full h-full sm:w-auto h-[72px] lg:h-auto px-4 lg:px-0">
        <div className="text-3xl italic flex items-center h-full">
          <Link className="flex" href="/">
            <AiOutlineStock size={40} className="inline mr-1" />
            growfolio
          </Link>
        </div>
        <div className="sm:hidden hover:cursor-pointer">
          <RxHamburgerMenu size={32} onClick={toggleNavbar} />
        </div>
      </div>

      {/* desktop */}
      <div className="hidden md:flex flex-grow text-xl justify-between items-center h-full">
        <div className="flex h-full items-center">
          <Link href="#why" className="h-full flex items-center px-4 hover:bg-green-500">
            Why
          </Link>
          <Link href="#pricing" className="h-full flex items-center px-4 hover:bg-green-500">
            Pricing
          </Link>
          <Link href="#contact" className="h-full flex items-center px-4 hover:bg-green-500">
            Contact
          </Link>
        </div>

        <div>
          <Button
            className="border-2 px-8"
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
      <div className={`${isOpen ? "block" : "hidden"} pb-4 text-lg md:hidden`}>
        <div className="flex flex-col">
          <Link
            className="px-4 py-2 hover:bg-green-500"
            href="#why"
            onClick={toggleNavbar}
          >
            Why
          </Link>
          <Link
            className="px-4 py-2 hover:bg-green-500"
            href="#pricing"
            onClick={toggleNavbar}
          >
            Pricing
          </Link>
          <Link
            className="px-4 py-2 hover:bg-green-500"
            href="#contact"
            onClick={toggleNavbar}
          >
            Contact
          </Link>
          <Button
            className={`mx-4 mt-2`}
            variant="tertiary"
            onClick={() => {
              router.push("/login");
            }}
          >
            Log in
          </Button>
        </div>
      </div>
    </nav>
  );
};