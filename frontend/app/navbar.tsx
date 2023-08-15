"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
import { FaHouse, FaPlus, FaSackDollar } from "react-icons/fa6";
import AddInvestmentForm from "./investments/add-investment-form";
import Modal from "./modal";
import { Investment } from "./page";

interface NavbarProps {
  children: any
}

export const Navbar: React.FC<NavbarProps> = ({ children }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddInvestmentModal, setShowAddInvestmentModal] =
    useState<boolean>(false);

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
    <div>
      <div className="w-full bg-gray-200">
        <div className="px-8 py-4 text-4xl font-bold text-green-400">
          <Link href="/">growfolio</Link>
        </div>
      </div>

      <div className="flex">
        <div className="flex-0">
          <div className="w-[300px] min-h-screen h-full p-8 bg-gray-100 whitespace-nowrap">
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
                Home
              </Link>
            </div>
            <div className="flex">
              <div className="mr-4">
                <FaSackDollar size={24} />
              </div>
              <div className="overflow-hidden flex-grow">
                <div className="mb-4 flex justify-between items-center">
                  <div>Investments</div>
                  <FaPlus
                    className="hover:cursor-pointer"
                    onClick={() => setShowAddInvestmentModal(true)}
                    size={20}
                  />
                  {showAddInvestmentModal && (
                    <Modal
                      title="Add investment"
                      onClose={() => setShowAddInvestmentModal(false)}
                    >
                      <AddInvestmentForm
                        onAdd={() => {
                          setShowAddInvestmentModal(false);
                          window.location.reload();
                        }}
                      />
                    </Modal>
                  )}
                </div>
                {loading && <p>Loading...</p>}
                {investments.length > 0 &&
                  investments.map((i) => {
                    const active = pathname == `/investments/${i.id}`;
                    return (
                      <div className={`py-1`}>
                        <Link
                          className={`${
                            active ? "text-green-400 font-bold" : ""
                          } hover:text-green-400 hover:font-bold`}
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
        <div className="flex-1 p-8 overflow-hidden">{children}</div>
      </div>
    </div>
  );
};