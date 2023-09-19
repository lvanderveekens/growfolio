"use client"

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaCaretDown } from "react-icons/fa6";
import { Investment, User } from "./page";
import { AiOutlineStock } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { api } from "./axios"

interface NavbarProps {
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setLoadingUser] = useState<boolean>(true);
  const [isUserDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const userDropdownRef = useRef(null);

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoadingInvestments, setLoadingInvestments] = useState<boolean>(true);
  const [isInvestmentsDropdownOpen, setInvestmentsDropdownOpen] = useState<boolean>(false);
  const investmentsDropdownRef = useRef(null);

  const router = useRouter();


  useEffect(() => {
    fetchCurrentUser();
    fetchInvestments();
  }, []);

  const fetchCurrentUser = async () => {
    setLoadingUser(true);
    console.log("fetching current user")
    api.get("/v1/users/current")
      .then((res) => {
        if (res.status === 200) {
          setUser(res.data);
        }
      })
      .finally(() => setLoadingUser(false));
  };

  const fetchInvestments = async () => {
    setLoadingInvestments(true);
    api.get(`/v1/investments`)
      .then((res) => {
        setInvestments(res.data);
      })
      .finally(() => setLoadingInvestments(false));
  };

  const toggleInvestmentsDropdown = () => {
    setInvestmentsDropdownOpen(!isInvestmentsDropdownOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeInvestmentsDropdown = () => {
    setInvestmentsDropdownOpen(false);
  };

  const closeUserDropdown = () => {
    setUserDropdownOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (investmentsDropdownRef.current && !investmentsDropdownRef.current.contains(event.target)) {
        closeInvestmentsDropdown();
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        closeUserDropdown();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <nav>
      <div className="px-8 py-4 w-full bg-gray-200 flex items-center gap-8 font-bold ">
        <div className="text-4xl text-green-400">
          <Link href="/">
            <AiOutlineStock size={48} className="inline mr-1" />
            growfolio
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between text-lg">
          <div className="flex gap-6">
            <Link className={`hover:text-green-400`} href="/">
              Overview
            </Link>
            <div className="flex relative" ref={investmentsDropdownRef}>
              <div
                className="flex items-center gap-1 hover:text-green-400 hover:cursor-pointer"
                onClick={toggleInvestmentsDropdown}
              >
                Investments
                <FaCaretDown />
              </div>
              <div
                className={`absolute left-0 top-full bg-gray-300 px-4 py-2 ${
                  isInvestmentsDropdownOpen ? "block" : "hidden"
                } whitespace-nowrap`}
              >
                {isLoadingInvestments && <p>Loading...</p>}
                {investments.length > 0 &&
                  investments.map((i) => {
                    return (
                      <div key={i.id} className={`py-1`}>
                        <Link
                          className={`hover:text-green-400`}
                          href={`/investments/${i.id}`}
                          onClick={closeInvestmentsDropdown}
                        >
                          <p className="overflow-hidden text-ellipsis">
                            {i.name}
                          </p>
                        </Link>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          <div>
            {isLoadingUser && <span>Loading...</span>}
            {!isLoadingUser && !user && (
              <button
                className="border border-black px-3 py-2 rounded-md"
                onClick={() => {
                  router.push("/api/v1/auth/google");
                }}
              >
                Log in
              </button>
            )}
            {!isLoadingUser && user && (
              <div className="flex relative" ref={userDropdownRef}>
                <div
                  className="flex items-center gap-1 hover:text-green-400 hover:cursor-pointer"
                  onClick={toggleUserDropdown}
                >
                  {user.email}
                  <FaCaretDown />
                </div>
                <div
                  className={`absolute left-0 top-full bg-gray-300 px-4 py-2 ${
                    isUserDropdownOpen ? "block" : "hidden"
                  } whitespace-nowrap`}
                >
                  <div className={`py-1`}>
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
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};