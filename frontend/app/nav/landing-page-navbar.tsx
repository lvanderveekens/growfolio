"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiOutlineBarChart, AiOutlineStock, AiOutlineUser } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { TbLogout } from 'react-icons/tb';
import { api } from "../axios";
import { FeedbackButton } from "../feedback/feedback-button";

interface LandingPageNavbarProps {
}

export const LandingPageNavbar: React.FC<LandingPageNavbarProps> = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="pt-[80px]">
      <nav className="fixed top-0 z-50 bg-white px-12 py-4 w-full sm:flex sm:items-center font-bold gap-12">
        <div className="flex justify-between items-center w-full sm:w-auto">
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
          <div className="flex gap-12">
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
            <button
              className={`text-white px-8 py-2 bg-green-400`}
              onClick={() => {
                router.push("/login");
              }}
            >
              Log in
            </button>
          </div>
        </div>

        {/* mobile */}
        <div className={`${isOpen ? "block" : "hidden"} text-lg md:hidden`}>
          <div className="flex flex-col gap-2">
            <div className="">
              <Link className={`hover:text-green-400`} href="/">
                <div className="flex items-center">
                  <AiOutlineBarChart className="mr-2" size={24} />
                  Overview
                </div>
              </Link>
            </div>
            <div className="">
              <Link className={`hover:text-green-400`} href="/profile">
                <div className="flex items-center">
                  <AiOutlineUser className="mr-2" size={24} />
                  Profile
                </div>
              </Link>
            </div>
            <div className="">
              <Link className={`hover:text-green-400`} href="/settings">
                <div className="flex items-center">
                  <IoSettingsOutline className="mr-2" size={24} />
                  Settings
                </div>
              </Link>
            </div>
            <div className={``}>
              <button
                className={`hover:text-green-400`}
                onClick={() => {
                  api.post(`/auth/logout`).then((res) => {
                    if (res.status === 200) {
                      router.push("/");
                    }
                  });
                }}
              >
                <div className="flex items-center">
                  <TbLogout className="mr-2" size={24} />
                  Log out
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};