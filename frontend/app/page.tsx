'use client'

import { Colors, ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import Link from 'next/link';
import { Doughnut } from 'react-chartjs-2';
import AddTransactionForm from './add-transaction-form';

ChartJS.register(Colors, ArcElement, Tooltip, Legend);

export default function Home() {
  // const [data, setData] = useState<any>();

  // useEffect(() => {
  //   fetch(`http://localhost:8888/v1/ping`, { method: "POST" })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setData(data);
  //     });
  // }, []);

  const data = {
    labels: ["Stocks", "Bitcoin"],
    datasets: [
      {
        data: [20_000, 4_900],
        borderWidth: 1,
      },
    ],
  };

  return (
    <main>
      <nav className="py-4 b-4">
        <div className="container mx-auto text-xl flex justify-between align-center">
          <div className="text-4xl font-bold self-center">
            <Link href="/">growfolio</Link>
          </div>
        </div>
      </nav>
      <div className="container mx-auto">
        <AddTransactionForm />
      </div>
    </main>
  );
}
