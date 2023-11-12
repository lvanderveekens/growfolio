"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiOutlineBarChart, AiOutlineStock, AiOutlineUser } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { TbLogout } from 'react-icons/tb';
import { api } from "../axios";
import { FeedbackButton } from "../feedback/feedback-button";
import { User } from "../overview-page";

interface AppNavbarProps {
}

export const AppNavbar: React.FC<AppNavbarProps> = () => {
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setLoadingUser] = useState<boolean>(true);
  const [isUserDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const userDropdownRef = useRef(null);

  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoadingUser(true);
    api.get("/user")
      .then((res) => {
        if (res.status === 200) {
          setUser(res.data);
        }
      })
      .finally(() => setLoadingUser(false));
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeUserDropdown = () => {
    setUserDropdownOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        closeUserDropdown();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="">
      <nav className="border-b z-50 px-4 py-2 lg:py-4 w-full bg-white sm:flex sm:items-center font-bold gap-8">
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
          <div className="flex gap-8">
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
          </div>

          <div>
            <button
              className={`hover:text-green-400`}
              onClick={() => {
                api.post(`/auth/logout`).then((res) => {
                  if (window.location.pathname === "/") {
                    window.location.reload();
                  } else {
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

        {/* mobile */}
        <div className={`${isOpen ? "block" : "hidden"} text-lg md:hidden`}>
          <div className="flex flex-col gap-2">
            {!isLoadingUser && user && (
              <div className="font-normal">{user.email}</div>
            )}
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
                    if (window.location.pathname === "/") {
                      window.location.reload();
                    } else {
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
      <FeedbackButton />
    </div>
  );
};