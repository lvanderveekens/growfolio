"use client";

import { useEffect, useState } from "react";
import { InvestmentType } from "./investment-type";
import AddInvestmentForm from "./investments/add-investment-form";

import {
  ArcElement,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
  TooltipItem,
} from "chart.js";
import "chartjs-adapter-moment";
import { Bar, Line, Pie } from "react-chartjs-2";
import { calculateTotalPrincipalForDate, calculateTotalValueForDate } from "./calculator";
import { Transaction } from "./investments/transaction";
import Modal from "./modal";
import { Navbar } from "./navbar";
import { capitalize, formatAmountAsEuroString, formatAmountInCentsAsEuroString, formatAsPercentage } from "./string";
import { buildMonthlyGrowthBarData, buildYearlyGrowthBarData, monthlyGrowthBarOptions, yearlyGrowthBarOptions } from "./investments/[id]/page";
import { api } from "./axios"
import { useRouter } from "next/navigation";
import ClipLoader from "react-spinners/ClipLoader";
import { useLocalStorage } from "./localstorage";
// import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  // ChartDataLabels,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale, //Register timescale instead of category for X axis
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HomePage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [updates, setUpdates] = useState<
    InvestmentUpdate[]
  >([]);
  const [transactons, setTransactions] = useState<Transaction[]>([]);

  const [investmentRows, setInvestmentRows] = useState<InvestmentRow[]>([]);

  const [updateDataPoints, setUpdateDataPoints] = useState<UpdateDataPoint[]>([]);
  const [monthlyChangeDataPoints, setMonthlyChangeDataPoints] = useState<MonthlyChangeDataPoint[]>([]);
  const [yearlyChangeDataPoints, setYearlyChangeDataPoints] = useState<YearlyChangeDataPoint[]>([]);

  const [selectedDateRange, setSelectedDateRange] = useLocalStorage<DateRange>("growfolio-selected-date-range", DateRange.ALL)

  const router = useRouter()

  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    console.log("selectedDateRage: " + selectedDateRange);
    if (selectedDateRange) {
      Promise.all([
        fetchInvestments(),
        fetchInvestmentUpdates(),
        fetchTransactions(),
      ]).finally(() => setLoading(false));
    }
  }, [selectedDateRange]);

  useEffect(() => {
    const uniqueUpdateDates = Array.from(
      new Set(updates.map((update) => update.date))
    );

    const updateDataPoints = uniqueUpdateDates.map((date) => {
      const value = calculateTotalValueForDate(date, updates);
      const principal = calculateTotalPrincipalForDate(date, transactons);
      const returnValue = value - principal;
      const roi = returnValue / principal;

      return {
        date: date,
        value: value,
        principal: principal,
        return: returnValue,
        roi: roi,
      };
    });

    setUpdateDataPoints(updateDataPoints);
    setMonthlyChangeDataPoints(
      calculateMonthlyChangeDataPoints(updateDataPoints)
    );
    setYearlyChangeDataPoints(
      calculateYearlyChangeDataPoints(updateDataPoints)
    );

    if (investments.length > 0) {
      const investmentRows = investments.map((i) => {
        const lastUpdate = updates.findLast((u) => u.investmentId == i.id)!;

        const value = lastUpdate?.value ?? 0;
        const principal = getInvestmentPrincipal(i);
        const returnValue = value - principal;
        const roi = returnValue / principal;

        return {
          id: i.id,
          name: i.name,
          lastUpdateDate: lastUpdate?.date ?? "-",
          principal: principal,
          value: value,
          return: returnValue,
          roi: roi,
        } as InvestmentRow;
      });

      setInvestmentRows(investmentRows);
    }
  }, [investments, transactons, updates]);

  const fetchInvestments = async () => {
    api
      .get(`/v1/investments`)
      .then((res) => {
        setInvestments(res.data);
      });
  };

  const fetchInvestmentUpdates = async () => {
    const dateFrom = convertToDate(selectedDateRange)
      ?.toISOString()
      ?.split("T")
      ?.[0]

    api.get(`/v1/investment-updates`, {
        params: {
          ...(dateFrom && { dateFrom: dateFrom }), 
        },
      }
    )
    .then((res) => setUpdates(res.data));
  };

  const calculateMonthlyChangeDataPoints = (
    updateDataPoints: UpdateDataPoint[]
  ) => {
    const firstAndLastUpdatesByYearMonth = new Map<
      string,
      [UpdateDataPoint, UpdateDataPoint]
    >();

    let currentYearMonth: string | null = null;
    let firstUpdateOfYearMonth: UpdateDataPoint | null = null;

    for (const updateDataPoint of updateDataPoints) {
      const yearMonth = updateDataPoint.date.substr(0, 7);
      if (yearMonth !== currentYearMonth) {
        currentYearMonth = yearMonth;
        firstUpdateOfYearMonth = updateDataPoint;

        firstAndLastUpdatesByYearMonth.set(yearMonth, [
          firstUpdateOfYearMonth!!,
          firstUpdateOfYearMonth!!,
        ]);
      } else {
        firstAndLastUpdatesByYearMonth.set(yearMonth, [
          firstUpdateOfYearMonth!!,
          updateDataPoint,
        ]);
      }
    }

    const dataPoints: MonthlyChangeDataPoint[] = [];
    const firstAndLastUpdatesByYearMonthEntries = Array.from(
      firstAndLastUpdatesByYearMonth.entries()
    );

    for (let i = 0; i < firstAndLastUpdatesByYearMonthEntries.length; i++) {
      const currentYearMonth = firstAndLastUpdatesByYearMonthEntries[i];

      if (i === firstAndLastUpdatesByYearMonthEntries.length - 1) {
        dataPoints.push({
          yearMonth: currentYearMonth[0],
          value: currentYearMonth[1][1].value - currentYearMonth[1][0].value,
          principal:
            currentYearMonth[1][1].principal - currentYearMonth[1][0].principal,
          return: currentYearMonth[1][1].return - currentYearMonth[1][0].return,
        });
        break;
      }

      const nextYearMonth = firstAndLastUpdatesByYearMonthEntries[i + 1];

      dataPoints.push({
        yearMonth: currentYearMonth[0],
        value: nextYearMonth[1][0].value - currentYearMonth[1][0].value,
        principal: nextYearMonth[1][0].principal - currentYearMonth[1][0].principal,
        return: nextYearMonth[1][0].return - currentYearMonth[1][0].return,
      });
    }

    return dataPoints;
  }; 

  const fetchTransactions = async () => {
    api.get(`/v1/transactions`).then((res) => setTransactions(res.data));
  };

  const buildPrincipalAndValueLineData = (
    updateDataPoints: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Principal",
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: x.principal / 100,
          })),
        },
        {
          label: "Value",
          borderColor: chartBackgroundColors[1],
          backgroundColor: chartBackgroundColors[1],
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: x.value / 100,
          })),
        },
      ],
    };
  };

  const buildReturnLineData = (
    dateWithPrincipalAndValue: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Return",
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: dateWithPrincipalAndValue.map((x) => ({
            x: x.date,
            y: (x.value - x.principal) / 100,
          })),
        },
      ],
    };
  };

  const buildROILineData = (
    updateDataPoints: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "ROI",
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: updateDataPoints.map((x) => {
            return {
              x: x.date,
              y: x.roi,
              // y: (((x.value - x.principal) / x.principal) * 100).toFixed(2),
            }
          }),
        },
      ],
    };
  };

  const getInvestmentPrincipal = (investment: Investment) => {
    const investmentTransactions = transactons.filter(
      (transaction) => transaction.investmentId == investment.id
    );
    return investmentTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  };

  const getLatestInvestmentValue = (investment: Investment) => {
    return (
      updates.findLast(
        (update) => update.investmentId == investment.id
      )?.value ?? 0
    );
  };

  const allocationPieOptions: ChartOptions = {
    plugins: {
      tooltip: {
        enabled: true,
        usePointStyle: true,
        callbacks: {
          label: function (context: TooltipItem<"pie">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            
            const legendItems = context.chart.legend.legendItems
            const totalVisibleValue = legendItems.reduce((acc, legendItem, index) => {
              if (legendItem.hidden == false) {
                return acc + context.dataset.data[index];
              } else {
                return acc;
              }
            }, 0);


            if (context.parsed !== null) {
              const valueString = formatAmountInCentsAsEuroString(context.parsed);
              const totalValuePercentage = formatAsPercentage(
                context.parsed / totalVisibleValue
              );
              label += `${valueString} (${totalValuePercentage})`;
            }
            return label;
          },
        },
      },
    },
  };

  const calculateAllocationPieData = (investments: Investment[]) => {
    return {
      labels: investments.map((i) => i.name),
      datasets: [
        {
          label: "Value",
          backgroundColor: chartBackgroundColors,
          data: investments.map((i) => {
            return getLatestInvestmentValue(i)
          }) ,
        },
      ],
    } as ChartData<"pie">;
  };

  const calculateAllocationByTypePieData = (investments: Investment[]) => {
    interface InvestmentTypeWithValue {
      type: InvestmentType;
      value: number;
    }

    const investmentTypeWithValues = investments.reduce<
      InvestmentTypeWithValue[]
    >((acc, i) => {
      const existing = acc.find((item) => item.type === i.type);

      if (existing) {
        existing.value += getLatestInvestmentValue(i);
      } else {
        acc.push({ type: i.type, value: getLatestInvestmentValue(i) });
      }

      return acc;
    }, []);

    return {
      labels: investmentTypeWithValues.map((i) => capitalize(i.type)),
      datasets: [
        {
          label: "Value",
          backgroundColor: chartBackgroundColors,
          data: investmentTypeWithValues.map((i) => {
            return i.value;
          }) 
        },
      ],
    };
  };

  const totalPrincipal = investmentRows.reduce(
    (acc, row) => acc + row.principal,
    0
  );
  const totalValue = investmentRows.reduce((acc, row) => acc + row.value, 0);
  const totalReturn = totalValue - totalPrincipal;
  const totalRoi = totalReturn / totalPrincipal;

  const [showAddInvestmentModal, setShowAddInvestmentModal] =
    useState<boolean>(false);

  return (
    <main>
      <Navbar />
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-8">Overview</h1>

          <div className="mb-4">
            <label className="font-bold">Date range:</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="border border-1 block"
            >
              {Object.values(DateRange).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="mb-4">
              <ClipLoader
                size={28}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            </div>
          )}
          {!loading && investmentRows.length === 0 && (
            <div className="mb-4">There are no investments yet.</div>
          )}
          {!loading && investmentRows.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border">
                    <th className="border px-3 text-left">Name</th>
                    <th className="border px-3 text-left">Principal</th>
                    <th className="border px-3 text-left">Value</th>
                    <th className="border px-3 text-left">Return</th>
                    <th className="border px-3 text-left">ROI</th>
                    <th className="border px-3 text-left">Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentRows.map((investmentRow) => {
                    return (
                      <tr key={investmentRow.id} className="border">
                        <td className="border px-3">{investmentRow.name}</td>
                        <td className="border px-3">
                          {formatAmountInCentsAsEuroString(
                            investmentRow.principal
                          )}
                        </td>
                        <td className="border px-3">
                          {formatAmountInCentsAsEuroString(investmentRow.value)}
                        </td>
                        <td className="border px-3">
                          {formatAmountInCentsAsEuroString(
                            investmentRow.return
                          )}
                        </td>
                        <td className="border px-3">
                          {formatAsPercentage(investmentRow.roi)}
                        </td>
                        <td className="border px-3">
                          {investmentRow.lastUpdateDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-2 border-t-black">
                  <tr className="border">
                    <td className="border px-3">Total</td>
                    <td className="border px-3">
                      {formatAmountInCentsAsEuroString(totalPrincipal)}
                    </td>
                    <td className="border px-3">
                      {formatAmountInCentsAsEuroString(totalValue)}
                    </td>
                    <td className="border px-3">
                      {formatAmountInCentsAsEuroString(totalReturn)}
                    </td>
                    <td className="border px-3">
                      {formatAsPercentage(totalRoi)}
                    </td>
                    <td className="border px-3">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <button
            className="border px-3 py-2 mb-4"
            type="submit"
            onClick={() => setShowAddInvestmentModal(true)}
          >
            Add investment
          </button>
          {showAddInvestmentModal && (
            <Modal
              title="Add investment"
              onClose={() => setShowAddInvestmentModal(false)}
            >
              <AddInvestmentForm
                onAdd={(investmentId) => {
                  router.push(`/investments/${investmentId}`);
                }}
              />
            </Modal>
          )}

        </div>

        {updateDataPoints.length > 0 && (
          <div className="mb-8 flex gap-8">
            <div className="w-[50%] aspect-square">
              <h1 className="text-xl font-bold mb-4">Allocation</h1>
              <Pie
                options={allocationPieOptions}
                data={calculateAllocationPieData(investments)}
              />
            </div>
            <div className="w-[50%] aspect-square">
              <h1 className="text-xl font-bold mb-4">Allocation by type</h1>
              <Pie
                options={allocationPieOptions}
                data={calculateAllocationByTypePieData(investments)}
              />
            </div>
          </div>
        )}

        {updateDataPoints.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">Principal and value</h1>
            <Line
              options={principalAndValueLineOptions}
              data={buildPrincipalAndValueLineData(updateDataPoints)}
            />
          </div>
        )}

        {updateDataPoints.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">Return</h1>
            <Line
              options={returnLineOptions}
              data={buildReturnLineData(updateDataPoints)}
            />
          </div>
        )}

        {updateDataPoints.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">ROI</h1>
            <Line
              options={roiLineOptions}
              data={buildROILineData(updateDataPoints)}
            />
          </div>
        )}

        {updateDataPoints.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">Monthly growth</h1>
            <Bar
              options={monthlyGrowthBarOptions}
              data={buildMonthlyGrowthBarData(monthlyChangeDataPoints)}
            />
          </div>
        )}

        {updateDataPoints.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">Yearly growth</h1>
            <Bar
              options={yearlyGrowthBarOptions}
              data={buildYearlyGrowthBarData(yearlyChangeDataPoints)}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export const principalAndValueLineOptions: any = {
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += formatAmountAsEuroString(context.parsed.y);
          }

          return label;
        },
      },
    },
  },
  scales: {
    x: {
      type: "time",
      time: {
        unit: "month",
        tooltipFormat: 'YYYY-MM-DD' 
      },
    },
    y: {
      ticks: {
        callback: function (value: any, index: any, ticks: any) {
          return formatAmountAsEuroString(value);
        },
      },
    },
  },
};

export const returnLineOptions: ChartOptions = {
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += formatAmountAsEuroString(context.parsed.y);
          }

          return label;
        },
      },
    },
  },
  scales: {
    x: {
      type: "time",
      time: {
        unit: "month",
        tooltipFormat: 'YYYY-MM-DD' 
      },
    },
    y: {
      ticks: {
        callback: function (value: any, index: any, ticks: any) {
          return formatAmountAsEuroString(value);
        },
      },
    },
  },
};

export const roiLineOptions: ChartOptions = {
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += formatAsPercentage(context.parsed.y);
          }

          return label;
        },
      },
    },
  },
  scales: {
    x: {
      type: "time",
      time: {
        unit: "month",
        tooltipFormat: 'YYYY-MM-DD' 
      },
    },
    y: {
      ticks: {
        callback: function (value: any, index: any, ticks: any) {
          return formatAsPercentage(value);
        },
      },
    },
  },
};

export interface User {
  id: string;
  email: string;
  provider: string;
}

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
}

export interface InvestmentUpdate {
  id?: string;
  date: string;
  investmentId: string;
  value: number;
}

export interface InvestmentRow {
  id: string;
  name: string;
  lastUpdateDate: string;
  principal: number;
  value: number;
  return: number;
  roi: number;
}

export interface UpdateDataPoint {
  date: string;
  principal: number;
  value: number;
  return: number;
  roi: number;
}

export interface MonthlyChangeDataPoint {
  yearMonth: string;
  value: number;
  principal: number;
  return: number;
}

export interface YearlyChangeDataPoint {
  year: string;
  value: number;
  principal: number;
  return: number;
}

export const chartBackgroundColors = [
  "rgb(255, 99, 132)",
  "rgb(54, 162, 235)",
  "rgb(255, 205, 86)",
  "rgb(255, 86, 205)",
  "rgb(87, 255, 205)",
];

export const calculateYearlyChangeDataPoints = (
  updateDataPoints: UpdateDataPoint[]
) => {
  const firstAndLastUpdatesByYear = new Map<
    string,
    [UpdateDataPoint, UpdateDataPoint]
  >();

  let currentYear: string | null = null;
  let firstUpdateOfYear: UpdateDataPoint | null = null;

  for (const updateDataPoint of updateDataPoints) {
    const year = updateDataPoint.date.substr(0, 4);
    if (year !== currentYear) {
      currentYear = year;
      firstUpdateOfYear = updateDataPoint;
    } else {
      firstAndLastUpdatesByYear.set(year, [
        firstUpdateOfYear!!,
        updateDataPoint,
      ]);
    }
  }

  const dataPoints: YearlyChangeDataPoint[] = [];
  const firstAndLastUpdatesByYearEntries = Array.from(
    firstAndLastUpdatesByYear.entries()
  );

  for (let i = 0; i < firstAndLastUpdatesByYearEntries.length; i++) {
    const currentYear = firstAndLastUpdatesByYearEntries[i];

    if (i === firstAndLastUpdatesByYearEntries.length - 1) {
      dataPoints.push({
        year: currentYear[0],
        value: currentYear[1][1].value - currentYear[1][0].value,
        principal: currentYear[1][1].principal - currentYear[1][0].principal,
        return: currentYear[1][1].return - currentYear[1][0].return,
      });
      break;
    }

    const nextYear = firstAndLastUpdatesByYearEntries[i + 1];

    dataPoints.push({
      year: currentYear[0],
      value: nextYear[1][0].value - currentYear[1][0].value,
      principal: nextYear[1][0].principal - currentYear[1][0].principal,
      return: nextYear[1][0].return - currentYear[1][0].return,
    });
  }
  return dataPoints;
}; 

export enum DateRange {
  LAST_MONTH = "Last month",
  LAST_3_MONTHS = "Last 3 months",
  LAST_6_MONTHS = "Last 6 months",
  LAST_YEAR = "Last year",
  LAST_2_YEARS = "Last 2 years",
  LAST_5_YEARS = "Last 5 years",
  LAST_10_YEARS = "Last 10 years",
  ALL = "All",
}

function convertToDate(range: DateRange): Date | null {
  const today = new Date();
  var minusDays: number | null = null

  switch (range) {
    case DateRange.LAST_MONTH:
      minusDays = 30
      break;
    case DateRange.LAST_3_MONTHS:
      minusDays = 3 * 30
      break;
    case DateRange.LAST_6_MONTHS:
      minusDays = 6 * 30
      break;
    case DateRange.LAST_YEAR:
      minusDays = 365
      break;
    case DateRange.LAST_2_YEARS:
      minusDays = 2 * 365
      break;
    case DateRange.LAST_5_YEARS:
      minusDays = 5 * 365
      break;
    case DateRange.LAST_10_YEARS:
      minusDays = 10 * 365
      break;
  }

  if (!minusDays) {
    return null
  }

  const date = new Date(today);
  date.setDate(today.getDate() - minusDays!!);
  return date
}