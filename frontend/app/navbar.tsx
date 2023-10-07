"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiOutlineBarChart, AiOutlineStock, AiOutlineUser } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { FaCaretDown } from "react-icons/fa6";
import { RxHamburgerMenu } from "react-icons/rx";
import ClipLoader from "react-spinners/ClipLoader";
import { api } from "./axios";
import { FeedbackButton } from "./feedback/feedback-button";
import { User } from "./page";
import { TbLogout } from 'react-icons/tb';

interface NavbarProps {
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setLoadingUser] = useState<boolean>(true);
  const [isUserDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const userDropdownRef = useRef(null);

  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    setLoadingUser(true);
    api.get("/v1/user")
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
    <div className="mt-[80px]">
      <nav className="fixed top-0 z-50 px-4 py-4 w-full bg-gray-200 sm:flex sm:items-center font-bold sm:gap-8">
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
        <div
          className={`${
            isOpen ? "block" : "hidden"
          } sm:block sm:flex sm:flex-1 sm:items-center sm:justify-between text-lg`}
        >
          <div className="sm:flex sm:gap-8">
            {!isLoadingUser && user && <div className="my-2 font-normal">{user.email}</div>}
            <div className="my-2">
              <Link className={`hover:text-green-400`} href="/">
                <div className="flex items-center">
                  <AiOutlineBarChart className="mr-2" size={24} />
                  Overview
                </div>
              </Link>
            </div>
            <div className="my-2">
              <Link className={`hover:text-green-400`} href="/profile">
                <div className="flex items-center">
                  <AiOutlineUser className="mr-2" size={24} />
                  Profile
                </div>
              </Link>
            </div>
            <div className="my-2">
              <Link className={`hover:text-green-400`} href="/settings">
                <div className="flex items-center">
                  <IoSettingsOutline className="mr-2" size={24} />
                  Settings
                </div>
              </Link>
            </div>
            <div className={`my-2`}>
              <button
                className={`hover:text-green-400`}
                onClick={() => {
                  api.post(`/v1/auth/logout`).then((res) => {
                    if (res.status === 200) {
                      router.push("/login");
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
          {/* <div className="sm:flex sm:gap-8">
            <div className="my-2">
              <Link className={`hover:text-green-400`} href="/settings">
                Settings
              </Link>
            </div>
          </div> */}
          {/* <div> */}
          {/* {isLoadingUser && (
              <ClipLoader
                size={28}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            )}
            {!isLoadingUser && user && (
              <div className="relative" ref={userDropdownRef}>
                <div
                  className="my-2 flex items-center gap-1 hover:text-green-400 hover:cursor-pointer"
                  onClick={toggleUserDropdown}
                >
                  {user.email}
                  <FaCaretDown />
                </div>
                <div
                  className={`sm:absolute sm:left-0 sm:top-full bg-gray-300 px-4 py-2 ${
                    isUserDropdownOpen ? "block" : "hidden"
                  } whitespace-nowrap`}
                ></div>
              </div>
            )} */}
          {/* </div> */}
        </div>
      </nav>
      <FeedbackButton />
    </div>
  );
};