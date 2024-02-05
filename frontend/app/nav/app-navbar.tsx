"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiOutlineStock } from "react-icons/ai";
import { FaCaretDown, FaCaretUp } from "react-icons/fa6";
import { RxHamburgerMenu } from "react-icons/rx";
import { api } from "../axios";
import { FeedbackButton } from "../feedback/feedback-button";
import { User } from "../portfolio-page";
import { ClipLoader } from "react-spinners";

interface AppNavbarProps {
}

export const AppNavbar: React.FC<AppNavbarProps> = () => {
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setLoadingUser] = useState<boolean>(true);

  const [isUserDropdownDesktopOpen, setUserDropdownDesktopOpen] = useState<boolean>(false);
  const [isUserDropdownMobileOpen, setUserDropdownMobileOpen] = useState<boolean>(false);

  const userDropdownDesktopRef = useRef(null);
  const userDropdownMobileRef = useRef(null);

  const [isToolsDropdownDesktopOpen, setToolsDropdownDesktopOpen] = useState<boolean>(false);
  const [isToolsDropdownMobileOpen, setToolsDropdownMobileOpen] = useState<boolean>(false);

  const toolsDropdownDesktopRef = useRef(null);
  const toolsDropdownMobileRef = useRef(null);

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
        setUserDropdownDesktopOpen(false);
      }
      if (userDropdownMobileRef.current && !userDropdownMobileRef.current.contains(event.target)) {
        setUserDropdownMobileOpen(false);
      }
      if (toolsDropdownDesktopRef.current && !toolsDropdownDesktopRef.current.contains(event.target)) {
        setToolsDropdownDesktopOpen(false)
      }
      if (toolsDropdownMobileRef.current && !toolsDropdownMobileRef.current.contains(event.target)) {
        setToolsDropdownMobileOpen(false)
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setUserDropdownDesktopOpen(false);
        setUserDropdownMobileOpen(false);
        setToolsDropdownDesktopOpen(false)
        setToolsDropdownMobileOpen(false)
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
      <nav className="sticky top-0 z-50 bg-green-400 text-white w-full lg:flex lg:items-center font-bold lg:h-[72px]">

        <div className="flex justify-between items-center w-full sm:w-auto h-[72px] lg:h-full">
          <div className="text-3xl italic h-full flex items-center">
            <Link className="flex h-full items-center px-4" href="/">
              <AiOutlineStock size={40} className="inline mr-1" />
              growfolio
            </Link>
          </div>
          <div className="sm:hidden h-full flex items-center px-4 hover:cursor-pointer" onClick={toggleMobileNav}>
            <RxHamburgerMenu size={32}  />
          </div>
        </div>

        {/* desktop */}
        <div className="hidden md:flex flex-grow text-xl justify-between items-center h-full">
          <div className="flex h-full items-center">
            <div className="h-full ">
              <Link href="/" className="h-full flex items-center px-4 hover:bg-green-500">
                <div className="flex items-center">Portfolio</div>
              </Link>
            </div>

            <div className="relative flex items-center h-full" ref={toolsDropdownDesktopRef}>
              <div
                className="flex items-center gap-1 hover:text-gray-100 hover:cursor-pointer px-4 h-full hover:bg-green-500"
                onClick={() => setToolsDropdownDesktopOpen(!isToolsDropdownDesktopOpen)}
              >
                Tools
                {/* pointer-events: none is used to make icons propagate onClick to parent */}
                <span className="pointer-events-none">
                  {isToolsDropdownDesktopOpen ? <FaCaretUp /> : <FaCaretDown />}
                </span>
              </div>
              <div
                className={`${
                  isToolsDropdownDesktopOpen ? "block" : "hidden"
                } font-normal border absolute mt-1 top-full left-0 min-w-full bg-white text-black rounded-md py-2 whitespace-nowrap shadow-md`}
              >
                <Link href="/tools/deposit-allocator">
                  <div className="px-4 py-2 hover:bg-gray-100">Deposit Allocator</div>
                </Link>
              </div>
            </div>

            <div className="h-full">
              <Link href="/profile" className="h-full flex items-center px-4 hover:bg-green-500">
                <div className="flex items-center">Profile</div>
              </Link>
            </div>
            <div className="h-full">
              <Link href="/settings" className="h-full flex items-center px-4 hover:bg-green-500">
                <div className="flex items-center">Settings</div>
              </Link>
            </div>
          </div>

          {isLoadingUser && <ClipLoader color="white" size={28} aria-label="Loading Spinner" data-testid="loader" />}
          {user && (
            <div className="relative flex items-center h-full" ref={userDropdownDesktopRef}>
              <div
                className="flex items-center gap-1 hover:text-gray-100 hover:cursor-pointer px-4 h-full hover:bg-green-500"
                onClick={toggleUserDropdownDesktop}
              >
                {user.email}
                {/* pointer-events: none is used to make icons propagate onClick to parent */}
                <span className="pointer-events-none">
                  {isUserDropdownDesktopOpen ? <FaCaretUp /> : <FaCaretDown />}
                </span>
              </div>
              <div
                className={`${
                  isUserDropdownDesktopOpen ? "block" : "hidden"
                } font-normal border absolute mt-1 top-full left-0 min-w-full bg-white text-black rounded-md py-2 whitespace-nowrap shadow-md`}
              >
                <div
                  className="hover:cursor-pointer hover:bg-gray-100 px-4 py-2"
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

        {/* mobile */}
        <div className={`${showMobileNav ? "block" : "hidden"} pb-4 lg md:hidden`}>
          <div className="flex flex-col">
            <Link className="px-4 py-2 hover:bg-green-500" href="/">
              <div className="flex items-center">Portfolio</div>
            </Link>

            <div className="relative" ref={toolsDropdownMobileRef}>
              <div
                className="flex justify-between items-center px-4 py-2 hover:bg-green-500 hover:cursor-pointer"
                onClick={() => setToolsDropdownMobileOpen(!isToolsDropdownMobileOpen)}
              >
                Tools
                {isToolsDropdownMobileOpen ? <FaCaretUp /> : <FaCaretDown />}
              </div>
              <div className={`${isToolsDropdownMobileOpen ? "block" : "hidden"} whitespace-nowrap`}>
                <Link className="hover:text-gray-100" href="/tools/deposit-allocator">
                  <div className="flex items-center pl-8 pr-4 py-2 hover:bg-green-500">
                    Deposit Allocator
                  </div>
                </Link>
              </div>
            </div>

            <Link className="px-4 py-2 hover:bg-green-500" href="/profile">
              <div className="flex items-center">Profile</div>
            </Link>
            <Link className="px-4 py-2 hover:bg-green-500" href="/settings">
              <div className="flex items-center">Settings</div>
            </Link>
            {!isLoadingUser && user && (
              <div className="relative" ref={userDropdownMobileRef}>
                <div
                  className="flex justify-between items-center px-4 py-2 hover:bg-green-500 hover:cursor-pointer"
                  onClick={toggleUserDropdownMobile}
                >
                  {user.email}
                  {isUserDropdownMobileOpen ? <FaCaretUp /> : <FaCaretDown />}
                </div>
                <div className={`${isUserDropdownMobileOpen ? "block" : "hidden"} whitespace-nowrap`}>
                  <div
                    className="hover:cursor-pointer hover:bg-green-500 pl-8 pr-4 py-2"
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
      </nav>
      <FeedbackButton />
    </>
  );
};