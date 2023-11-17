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
    <nav className="sticky top-0 border-b z-50 bg-white lg:px-12 py-2 lg:py-4 w-full lg:flex lg:items-center font-bold gap-8">
      <div className="px-4 lg:px-0 lg:px-auto flex justify-between items-center w-full sm:w-auto">
        <div className="text-3xl sm:text-4xl text-green-400">
          <Link href="/">
            <AiOutlineStock size={48} className="inline mr-1" />
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
          <Link className={`hover:text-green-400`} href="#why">
            Why
          </Link>
          <Link className={`hover:text-green-400`} href="#pricing">
            Pricing
          </Link>
          <Link className={`hover:text-green-400`} href="#contact">
            Contact
          </Link>
        </div>

        <div>
          <Button
            className={`font-bold px-8`}
            variant="primary"
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
          <div className="px-4 ">
            <Link
              className={`hover:text-green-400`}
              href="#why"
              onClick={toggleNavbar}
            >
              Why
            </Link>
          </div>
          <div className="px-4 ">
            <Link
              className={`hover:text-green-400`}
              href="#pricing"
              onClick={toggleNavbar}
            >
              Pricing
            </Link>
          </div>
          <div className="px-4 ">
            <Link
              className={`hover:text-green-400`}
              href="#contact"
              onClick={toggleNavbar}
            >
              Contact
            </Link>
          </div>
          <div className={`px-4`}>
            <Button
              className={`w-full`}
              variant="primary"
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