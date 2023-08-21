"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
import { FaCaretDown, FaHouse, FaPlus, FaSackDollar } from "react-icons/fa6";
import AddInvestmentForm from "./investments/add-investment-form";
import Modal from "./modal";
import { Investment } from "./page";

interface NavbarProps {
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const pathname = usePathname();

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    fetch(`http://localhost:8888/v1/investments`)
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data);
      })
      .finally(() => setLoading(false));
  };

  return (
    <nav>
      <div className="px-8 py-4 w-full bg-gray-200 flex items-center gap-8 font-bold ">
        <div className="text-4xl text-green-400">
          <Link href="/">growfolio</Link>
        </div>
        <div className="flex gap-6 text-lg">
          <Link
            className={`hover:text-green-400`}
            href="/"
          >
            Overview
          </Link>
          <div className="relative group hover:cursor-pointer">
            <div className="flex items-center gap-1">
              Investments
              <FaCaretDown />
            </div>

            <div className="absolute left-0 bg-gray-300 px-4 py-2 hidden group-hover:block whitespace-nowrap">
              {loading && <p>Loading...</p>}
              {investments.length > 0 &&
                investments.map((i) => {
                  const active = pathname == `/investments/${i.id}`;
                  return (
                    <div className={`py-1`}>
                      <Link
                        className={`hover:text-green-400`}
                        href={`/investments/${i.id}`}
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
      </div>

      {/* <div className="flex">
        <div className="flex-0">
          <div className="w-[300px] min-h-screen h-full p-8 bg-gray-100 whitespace-nowrap">
            
            <div className="flex">
              <div className="mr-4">
                <FaSackDollar size={24} />
              </div>
              
            </div>
          </div>
        </div>
      </div> */}
    </nav>
  );
};