"use client"

import Link from "next/link";
import { FaHouse, FaSackDollar } from "react-icons/fa6";
import { Investment } from "./page";
import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';

export const Navbar: React.FC = () => {

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true)

  const pathname = usePathname()

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true)
    fetch(`http://localhost:8888/v1/investments`)
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data);
      })
      .finally(() => setLoading(false));
  };

  return (
    <nav className="w-[300px] min-h-screen h-full p-8 bg-gray-100 whitespace-nowrap">
      <div className="mb-8 text-4xl font-bold text-green-400">
        <Link href="/">growfolio</Link>
      </div>
      <div className="mb-8 flex">
        <div className="mr-4">
          <FaHouse size={24} />
        </div>
        <Link
          className={`${
            pathname == "/" ? "text-green-400 font-bold" : ""
          } hover:text-green-400 hover:font-bold`}
          href="/"
        >
          Overview
        </Link>
      </div>
      <div className="flex">
        <div className="mr-4">
          <FaSackDollar size={24} />
        </div>
        <div className="overflow-hidden">
          <div className="mb-4">Investments</div>
          {loading && <p>Loading...</p>}
          {investments.length > 0 &&
            investments.map((i) => {
              const active = pathname == `/investments/${i.id}`
              return (
                <div className={`py-1 pl-3 border-l border-gray-300`}>
                  <Link
                    className={`${
                      active ? "text-green-400 font-bold" : ""
                    } hover:text-green-400 hover:font-bold`}
                    href={`/investments/${i.id}`}
                  >
                    <p className="overflow-hidden text-ellipsis">{i.name}</p>
                  </Link>
                </div>
              );})}
        </div>
      </div>
    </nav>
  );
};