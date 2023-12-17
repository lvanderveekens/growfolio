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
import { User } from "../portfolio-page";
import { Button } from "../button";
import { FaCaretDown, FaCaretUp } from "react-icons/fa6";

interface AppNavbarProps {
}

export const AppNavbar: React.FC<AppNavbarProps> = () => {
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setLoadingUser] = useState<boolean>(true);
  const [isUserDropdownDesktopOpen, setUserDropdownDesktopOpen] = useState<boolean>(false);
  const [isUserDropdownMobileOpen, setUserDropdownMobileOpen] = useState<boolean>(false);
  const userDropdownDesktopRef = useRef(null);

  const router = useRouter();

  const [showMobileNav, setShowMobileNav] = useState(false);

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

  const toggleUserDropdownDesktop = () => {
    setUserDropdownDesktopOpen(!isUserDropdownDesktopOpen);
  };

  const toggleUserDropdownMobile = () => {
    setUserDropdownMobileOpen(!isUserDropdownMobileOpen);
  };

  const closeUserDropdownDesktop = () => {
    setUserDropdownDesktopOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userDropdownDesktopRef.current && !userDropdownDesktopRef.current.contains(event.target)) {
        closeUserDropdownDesktop();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        closeUserDropdownDesktop();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.addEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const toggleMobileNav = () => {
    setShowMobileNav(!showMobileNav);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 px-4 w-full bg-green-400 text-white lg:flex lg:items-center font-bold gap-8">
        <div className="flex justify-between items-center w-full sm:w-auto">
          <div className="text-3xl py-4 italic">
            <Link href="/">
              <AiOutlineStock size={40} className="inline mr-1" />
              growfolio
            </Link>
          </div>
          <div className="sm:hidden">
            <RxHamburgerMenu size={32} onClick={toggleMobileNav} />
          </div>
        </div>

        {/* desktop */}
        <div className="hidden md:flex flex-grow text-xl justify-between items-center">
          <div className="flex gap-8 h-full items-center">
            <div className="hover:text-gray-100">
              <Link href="/">
                <div className="flex items-center">Portfolio</div>
              </Link>
            </div>
            <div className="hover:text-gray-100">
              <Link href="/profile">
                <div className="flex items-center">Profile</div>
              </Link>
            </div>
            <div className="hover:text-gray-100">
              <Link href="/settings">
                <div className="flex items-center">Settings</div>
              </Link>
            </div>
          </div>

          <div>
            {!isLoadingUser && user && (
              <div className="relative" ref={userDropdownDesktopRef}>
                <div
                  className="my-2 flex items-center gap-1 hover:text-gray-100 hover:cursor-pointer"
                  onClick={toggleUserDropdownDesktop}
                >
                  {user.email}
                  {isUserDropdownDesktopOpen ? <FaCaretUp /> : <FaCaretDown />}
                </div>
                <div
                  className={`${
                    isUserDropdownDesktopOpen ? "block" : "hidden"
                  } absolute left-0 bg-green-500 whitespace-nowrap shadow-md`}
                >
                  <div
                    className="hover:cursor-pointer hover:bg-green-600 px-4 py-2"
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
                    Log out
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* mobile */}
        <div className={`${showMobileNav ? "block" : "hidden"} pb-4 lg md:hidden`}>
          <div className="flex flex-col gap-4">
            <Link className="hover:text-gray-100" href="/">
              <div className="flex items-center">Portfolio</div>
            </Link>
            <Link className="hover:text-gray-100" href="/profile">
              <div className="flex items-center">Profile</div>
            </Link>
            <Link className="hover:text-gray-100" href="/settings">
              <div className="flex items-center">Settings</div>
            </Link>
            <div>
              {!isLoadingUser && user && (
                <div className="relative">
                  <div
                    className="flex justify-between items-center hover:text-gray-100 hover:cursor-pointer"
                    onClick={toggleUserDropdownMobile}
                  >
                    {user.email}
                    {isUserDropdownMobileOpen ? <FaCaretUp /> : <FaCaretDown />}
                  </div>
                  <div
                    className={`${isUserDropdownMobileOpen ? "block" : "hidden"} mt-2 bg-green-500 whitespace-nowrap`}
                  >
                    <div
                      className="hover:cursor-pointer hover:bg-green-600 px-4 py-2"
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
                      Log out
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <FeedbackButton />
    </>
  );
};