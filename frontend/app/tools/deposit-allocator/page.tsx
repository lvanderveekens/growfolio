"use client"

import { api } from "@/app/axios";
import { Investment } from "@/app/portfolio-page";
import { Currency, Settings, decimalSeparatorsByCurrency, groupSeparatorsByCurrency, signPrefixesByCurrency } from "@/app/settings/settings";
import { formatAmountInCentsAsCurrencyString, formatAsPercentage } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { ClipLoader } from "react-spinners";
import AppLayout from "../../app-layout";
import { NumericFormat } from "react-number-format";
import Dropdown from "@/app/dropdown";
import { DepositAllocatorType, labelsByDepositAllocatorType } from "./deposit-allocator-type";
import { InvestmentType, labelsByInvestmentType } from "@/app/investment-type";

export default function DepositAllocatorPage() {
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<Settings>();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentTypes, setInvestmentTypes] = useState<InvestmentType[]>([]);

  const [amountToDeposit, setAmountToDeposit] = useState<number>();
  const [type, setType] = useState<DepositAllocatorType>(DepositAllocatorType.INVESTMENT);

  // allocate by investment
  const [selectedInvestments, setSelectedInvestments] = useState<Investment[]>([]);
  const [beforeWeightsByInvestmentId, setBeforeWeightsByInvestmentId] = useState<Map<string, number>>(new Map());
  const [desiredWeightsByInvestmentId, setDesiredWeightsByInvestmentId] = useState<Map<string, number>>(new Map());
  const [desiredWeightsByInvestmentIdError, setDesiredWeightsByInvestmentIdError] = useState<string>();
  const totalDesiredPercentageForInvestment = Array.from(desiredWeightsByInvestmentId.values()).reduce(
    (sum, desiredWeight) => sum + desiredWeight,
    0
  );

  // allocate by investment type
  const [selectedInvestmentTypes, setSelectedInvestmentTypes] = useState<InvestmentType[]>([]);
  const [beforeWeightsByInvestmentType, setBeforeWeightsByInvestmentType] = useState<Map<InvestmentType, number>>(
    new Map()
  );
  const [desiredWeightsByInvestmentType, setDesiredWeightsByInvestmentType] = useState<Map<InvestmentType, number>>(
    new Map()
  );
  const [desiredWeightsByInvestmentTypeError, setDesiredWeightsByInvestmentTypeError] = useState<string>();
  const totalDesiredPercentageForInvestmentType = Array.from(desiredWeightsByInvestmentType.values()).reduce(
    (sum, desiredWeight) => sum + desiredWeight,
    0
  );

  const totalInvestmentValueAfterDeposit =
    selectedInvestments.reduce((acc, curr) => acc + (curr.lastUpdate?.value ?? 0), 0) + (amountToDeposit ?? 0);

  const totalInvestmentTypeValueAfterDeposit =
    selectedInvestmentTypes.reduce((acc, curr) => acc + getInvestmentValueByType(curr), 0) + (amountToDeposit ?? 0);

  const [depositsByInvestmentId, setDepositsByInvestmentId] = useState<Map<string, number>>(new Map());
  const [depositsByInvestmentType, setDepositsByInvestmentType] = useState<Map<InvestmentType, number>>(new Map());

  const fetchSettings = async () => {
    api.get(`/settings`).then((res) => {
      setSettings(res.data);
    });
  };

  const fetchInvestments = async () => {
    api.get(`/investments`).then((res) => {
      setInvestments(res.data);
    });
  };

  useEffect(() => {
    Promise.all([fetchSettings(), fetchInvestments()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedInvestments(investments);

    const investmentTypes = Array.from(
      investments.reduce((typesSet, investment) => {
        typesSet.add(investment.type);
        return typesSet;
      }, new Set<InvestmentType>())
    );
    setInvestmentTypes(investmentTypes);
    setSelectedInvestmentTypes(investmentTypes);
  }, [investments, type]);

  useEffect(() => {
    const weightsByInvestmentId = calculateWeightsByInvestmentId(selectedInvestments);
    setBeforeWeightsByInvestmentId(weightsByInvestmentId);
    setDesiredWeightsByInvestmentId(new Map());
  }, [selectedInvestments]);

  useEffect(() => {
    const weightsByInvestmentType = calculateWeightsByInvestmentType(selectedInvestmentTypes);
    setBeforeWeightsByInvestmentType(weightsByInvestmentType);
    setDesiredWeightsByInvestmentType(new Map());
  }, [selectedInvestmentTypes]);

  useEffect(() => {
    setDepositsByInvestmentType(calculateDepositsByInvestmentType())
  }, [selectedInvestmentTypes, desiredWeightsByInvestmentType, desiredWeightsByInvestmentTypeError, amountToDeposit]);

  useEffect(() => {
    setDepositsByInvestmentId(calculateDepositsByInvestmentId())
  }, [selectedInvestments, desiredWeightsByInvestmentId, desiredWeightsByInvestmentIdError, amountToDeposit]);

  useEffect(() => {
    if (
      beforeWeightsByInvestmentId.size > 0 &&
      beforeWeightsByInvestmentId.size === desiredWeightsByInvestmentId.size &&
      totalDesiredPercentageForInvestment !== 100
    ) {
      setDesiredWeightsByInvestmentIdError(`Total of desired weights equals: ${totalDesiredPercentageForInvestment}%`);
    } else {
      setDesiredWeightsByInvestmentIdError(undefined);
    }
  }, [desiredWeightsByInvestmentId, beforeWeightsByInvestmentId]);

  useEffect(() => {
    if (
      beforeWeightsByInvestmentType.size > 0 &&
      desiredWeightsByInvestmentType.size === beforeWeightsByInvestmentType.size &&
      totalDesiredPercentageForInvestmentType !== 100
    ) {
      setDesiredWeightsByInvestmentTypeError(
        `Total of desired weights equals: ${totalDesiredPercentageForInvestmentType}%`
      );
    } else {
      setDesiredWeightsByInvestmentTypeError(undefined);
    }
  }, [desiredWeightsByInvestmentType, beforeWeightsByInvestmentType]);

  const calculateWeightsByInvestmentId = (investments: Investment[]) => {
    const weightsByInvestmentId = new Map<string, number>();

    const totalValue = investments.reduce((acc, current) => acc + (current.lastUpdate?.value ?? 0), 0);

    for (const investment of investments) {
      const value = investment.lastUpdate?.value ?? 0;
      weightsByInvestmentId.set(investment.id, Math.round((value / totalValue) * 100));
    }

    return weightsByInvestmentId;
  };

  const calculateWeightsByInvestmentType = (investmentTypes: InvestmentType[]) => {
    const weightsByInvestmentType = new Map<InvestmentType, number>();

    const totalValue = investments
      .filter((investment) => investmentTypes.includes(investment.type))
      .reduce((acc, current) => acc + (current.lastUpdate?.value ?? 0), 0);

    for (const investmentType of investmentTypes) {
      const value = getInvestmentValueByType(investmentType);
      weightsByInvestmentType.set(investmentType, Math.round((value / totalValue) * 100));
    }

    return weightsByInvestmentType;
  };

  const currency = settings?.currency;

  function getInvestmentValueByType(investmentType: InvestmentType): number {
    return investments
      .filter((investment) => investment.type === investmentType)
      .reduce((sum, investment) => sum + (investment.lastUpdate?.value ?? 0), 0);
  }

  function calculateDepositForInvestment(investment: Investment): number {
    if (amountToDeposit === undefined) {
      return 0;
    }
    const desiredWeight = desiredWeightsByInvestmentId.get(investment.id);
    if (desiredWeight === undefined) {
      return 0;
    }
    if (desiredWeightsByInvestmentId.size !== beforeWeightsByInvestmentId.size) {
      return 0;
    }
    if (desiredWeightsByInvestmentIdError) {
      return 0;
    }

    const desiredValue = totalInvestmentValueAfterDeposit * (desiredWeight / 100);
    const value = investment.lastUpdate?.value ?? 0;
    const desiredDeposit = desiredValue - value;
    if (desiredDeposit <= 0) {
      return 0;
    }

    const depositWeight = calculateDepositWeightForInvestment(investment);
    return depositWeight * amountToDeposit;
  }

  function calculateDepositForInvestmentType(investmentType: InvestmentType): number {
    if (amountToDeposit === undefined) {
      return 0;
    }
    const desiredWeight = desiredWeightsByInvestmentType.get(investmentType);
    if (desiredWeight === undefined) {
      return 0;
    }
    if (desiredWeightsByInvestmentType.size !== beforeWeightsByInvestmentType.size) {
      return 0;
    }
    if (desiredWeightsByInvestmentTypeError) {
      return 0;
    }

    const desiredValue = totalInvestmentTypeValueAfterDeposit * (desiredWeight / 100);
    const value = getInvestmentValueByType(investmentType);

    var desiredDeposit = desiredValue - value;
    if (desiredDeposit <= 0) {
      return 0;
    }

    const depositWeight = calculateDepositWeightForInvestmentType(investmentType);
    return depositWeight * amountToDeposit;
  }

  function calculateDepositsByInvestmentType(): Map<InvestmentType, number> {
    const depositsByInvestmentType = new Map<InvestmentType, number>(); 

    for (const selectedInvestmentType of selectedInvestmentTypes) {
      const deposit = calculateDepositForInvestmentType(selectedInvestmentType)
      depositsByInvestmentType.set(selectedInvestmentType, deposit)
    }

    return depositsByInvestmentType;
  }

  function calculateDepositsByInvestmentId(): Map<string, number> {
    const depositsByInvestmentId = new Map<string, number>(); 

    for (const selectedInvestment of selectedInvestments) {
      const deposit = calculateDepositForInvestment(selectedInvestment)
      depositsByInvestmentId.set(selectedInvestment.id, deposit)
    }

    return depositsByInvestmentId;
  }

  function calculateDepositWeightForInvestmentType(investmentType: InvestmentType): number {
    const valuesByInvestmentType = investments
      .filter((investment) => selectedInvestmentTypes.includes(investment.type))
      .reduce((grouped, investment) => {
        if (!grouped.get(investment.type)) {
          grouped.set(investment.type, 0);
        }
        const investmentValue = investment.lastUpdate?.value ?? 0;
        grouped.set(investment.type, grouped.get(investment.type)!! + investmentValue);
        return grouped;
      }, new Map<InvestmentType, number>());


    console.log("valuesByInvestmentType")
    console.log(valuesByInvestmentType)

    const desiredDepositsByInvestmentType = new Map(
      Array.from(valuesByInvestmentType.entries()).map(([investmentType, value]) => {
        const desiredWeight = desiredWeightsByInvestmentType.get(investmentType)!!;
        const desiredValue = totalInvestmentTypeValueAfterDeposit * (desiredWeight / 100);
        const desiredDeposit = desiredValue - value;

        return [investmentType, desiredDeposit];
      })
    );

    console.log("desiredDepositsByInvestmentType")
    console.log(desiredDepositsByInvestmentType)

    const positiveDesiredDepositsByInvestmentType = Array.from(desiredDepositsByInvestmentType.entries()).filter(
      ([_, desiredDeposit]) => desiredDeposit > 0
    );

    const totalPositiveDesiredDeposit = positiveDesiredDepositsByInvestmentType.reduce(
      (sum, [_, positiveDesiredDeposit]) => sum + positiveDesiredDeposit,
      0
    );

    return desiredDepositsByInvestmentType.get(investmentType)!! / totalPositiveDesiredDeposit;
  }

  function calculateDepositWeightForInvestment(investment: Investment): number {
    const valuesByInvestmentId = selectedInvestments.reduce((grouped, investment) => {
      if (!grouped.get(investment.id)) {
        grouped.set(investment.id, 0);
      }
      const investmentValue = investment.lastUpdate?.value ?? 0;
      grouped.set(investment.id, investmentValue);
      return grouped;
    }, new Map<string, number>());

    const desiredDepositsByInvestmentId = new Map(
      Array.from(valuesByInvestmentId.entries()).map(([investmentId, value]) => {
        const desiredWeight = desiredWeightsByInvestmentId.get(investmentId)!!;
        const desiredValue = totalInvestmentValueAfterDeposit * (desiredWeight / 100);
        const desiredDeposit = desiredValue - value;

        return [investmentId, desiredDeposit];
      })
    );

    const positiveDesiredDepositsByInvestmentId = Array.from(desiredDepositsByInvestmentId.entries()).filter(
      ([_, desiredDeposit]) => desiredDeposit > 0
    );

    const totalPositiveDesiredDeposit = positiveDesiredDepositsByInvestmentId.reduce(
      (sum, [_, positiveDesiredDeposit]) => sum + positiveDesiredDeposit,
      0
    );

    return desiredDepositsByInvestmentId.get(investment.id)!! / totalPositiveDesiredDeposit;
  }

  function renderHowToAllocateDepositOverInvestments() {
    if (selectedInvestments.length === 0) {
      return <div>No investments selected</div>;
    }
    if (!amountToDeposit) {
      return <div>Fill in the amount to deposit.</div>;
    }
    if (desiredWeightsByInvestmentId.size !== beforeWeightsByInvestmentId.size || desiredWeightsByInvestmentIdError) {
      return <div>Fill in the desired weights.</div>;
    }

    return (
      <table className="whitespace-normal border border-collapse">
        <thead>
          <tr className="">
            <th className="w-[300px]">Investment</th>
            <th className="">Amount</th>
            <th className="">After</th>
          </tr>
        </thead>
        <tbody>
          {selectedInvestments.map((investment, index) => {
            return (
              <tr key={investment.id} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <td>{investment.name}</td>
                <td>
                  {currency &&
                    formatAmountInCentsAsCurrencyString(depositsByInvestmentId.get(investment.id) ?? 0, currency)}
                </td>
                <td>
                  ~
                  {currency &&
                    formatAsPercentage(
                      ((investment.lastUpdate?.value ?? 0) + (depositsByInvestmentId.get(investment.id) ?? 0)) /
                        totalInvestmentValueAfterDeposit,
                      0
                    )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function renderHowToAllocateDepositOverInvestmentTypes() {
    if (selectedInvestmentTypes.length === 0) {
      return <div>No investment types selected</div>;
    }
    if (!amountToDeposit) {
      return <div>Fill in the amount to deposit.</div>;
    }
    if (
      desiredWeightsByInvestmentType.size !== beforeWeightsByInvestmentType.size ||
      desiredWeightsByInvestmentTypeError
    ) {
      return <div>Fill in the desired weights.</div>;
    }

    return (
      <table className="whitespace-normal border border-collapse">
        <thead>
          <tr className="">
            <th className="w-[300px]">Investment type</th>
            <th className="">Amount</th>
            <th className="">After</th>
          </tr>
        </thead>
        <tbody>
          {selectedInvestmentTypes.map((investmentType, index) => {
            return (
              <tr key={investmentType} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <td>{labelsByInvestmentType[investmentType]}</td>
                <td className="">
                  {currency &&
                    formatAmountInCentsAsCurrencyString(depositsByInvestmentType.get(investmentType) ?? 0, currency)}
                </td>
                <td>
                  ~
                  {currency &&
                    formatAsPercentage(
                      (getInvestmentValueByType(investmentType) + (depositsByInvestmentType.get(investmentType) ?? 0)) /
                        totalInvestmentTypeValueAfterDeposit,
                      0
                    )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <AppLayout>
      <div className="container my-4">
        <h1 className="text-3xl sm:text-3xl font-bold mb-4">Deposit Allocator</h1>

        {loading && <ClipLoader color="black" size={28} aria-label="Loading Spinner" data-testid="loader" />}
        {!loading && (
          <div className="w-full lg:w-[400px]">
            <div className="mb-4">
              <label className="font-bold">Amount to deposit</label>
              <CurrencyInput
                className="border w-full px-2 py-2"
                prefix={currency && signPrefixesByCurrency[currency]}
                placeholder={currency && signPrefixesByCurrency[currency]}
                decimalsLimit={2}
                onValueChange={(value, name, values) => {
                  if (values && values.float != null) {
                    setAmountToDeposit(Math.round(values.float * 100));
                  } else {
                    setAmountToDeposit(undefined);
                  }
                }}
                groupSeparator={currency && groupSeparatorsByCurrency[currency]}
                decimalSeparator={currency && decimalSeparatorsByCurrency[currency]}
              />
            </div>

            <div className="mb-4">
              <label className="font-bold">Allocate by</label>
              <Dropdown
                className="w-full"
                selected={
                  type && {
                    label: labelsByDepositAllocatorType[type],
                    value: type,
                  }
                }
                onChange={(option) => setType(option.value)}
                options={Object.values(DepositAllocatorType).map((value) => ({
                  label: labelsByDepositAllocatorType[value],
                  value: value,
                }))}
              />
            </div>

            {type === DepositAllocatorType.INVESTMENT && (
              <>
                <div className="mb-4">
                  <label className="font-bold">Investments</label>
                  {investments.length === 0 && <p>No investments found...</p>}
                  {investments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {investments.map((investment) => {
                        const checked = selectedInvestments.some((x) => x.id === investment.id);
                        return (
                          <label
                            key={investment.id}
                            className="flex bg-white items-center border p-2 gap-1 hover:cursor-pointer"
                          >
                            <input
                              className="w-auto mr-1"
                              type="checkbox"
                              value={investment.id}
                              checked={checked}
                              onChange={() => {
                                const selectedInvestment = investments.find((x) => x.id === investment.id)!;
                                if (checked) {
                                  setSelectedInvestments((prev) => prev.filter((x) => x.id !== investment.id));
                                } else {
                                  setSelectedInvestments((prev) => [...prev, selectedInvestment]);
                                }
                              }}
                            />
                            <div className="w-full flex justify-between">
                              <div>{investment.name}</div>
                              <div>
                                {currency &&
                                  formatAmountInCentsAsCurrencyString(investment.lastUpdate?.value ?? 0, currency)}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="">
                    <label className="font-bold">Allocation</label>
                  </div>

                  {selectedInvestments.length === 0 && <p>No investments selected</p>}
                  {selectedInvestments.length > 0 && (
                    <>
                      <table className="whitespace-normal border border-collapse">
                        <thead>
                          <tr className="">
                            <th>Investment</th>
                            <th className="w-[90px]">Before</th>
                            <th className="w-[90px]">Desired</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvestments.map((investment, index) => {
                            // Passing "" instead of null because https://github.com/s-yadav/react-number-format/issues/727
                            const beforeWeight = beforeWeightsByInvestmentId.get(investment.id) ?? "";
                            const desiredWeight = desiredWeightsByInvestmentId.get(investment.id) ?? "";

                            return (
                              <tr key={investment.id} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                <td>{investment.name}</td>
                                <td>~{beforeWeight}%</td>
                                <td>
                                  <NumericFormat
                                    decimalScale={0}
                                    className="h-auto p-0"
                                    min="1"
                                    max="100"
                                    value={desiredWeight}
                                    placeholder="%"
                                    suffix="%"
                                    onValueChange={(values, _) => {
                                      const value = values.floatValue;
                                      if (value !== undefined) {
                                        setDesiredWeightsByInvestmentId((prevState) => {
                                          const newState = new Map(prevState);
                                          newState.set(investment.id, value);
                                          return newState;
                                        });
                                      } else {
                                        setDesiredWeightsByInvestmentId((prevState) => {
                                          const newState = new Map(prevState);
                                          newState.delete(investment.id);
                                          return newState;
                                        });
                                      }
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {desiredWeightsByInvestmentIdError && (
                        <div className="text-red-500">{desiredWeightsByInvestmentIdError}</div>
                      )}
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <label className="font-bold">How to allocate deposit</label>
                  {renderHowToAllocateDepositOverInvestments()}
                </div>
              </>
            )}

            {type === DepositAllocatorType.INVESTMENT_TYPE && (
              <>
                <div className="mb-4">
                  <label className="font-bold">Investment types</label>
                  {investments.length === 0 && <p>No investments found...</p>}
                  {investments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {investmentTypes.map((investmentType) => {
                        const checked = selectedInvestmentTypes.includes(investmentType);
                        return (
                          <label
                            key={investmentType}
                            className="flex bg-white items-center border p-2 gap-1 hover:cursor-pointer"
                          >
                            <input
                              className="w-auto mr-1"
                              type="checkbox"
                              value={investmentType}
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setSelectedInvestmentTypes((prev) => prev.filter((x) => x !== investmentType));
                                } else {
                                  setSelectedInvestmentTypes((prev) => [...prev, investmentType]);
                                }
                              }}
                            />
                            <div className="w-full flex justify-between">
                              <div>{labelsByInvestmentType[investmentType]}</div>
                              <div>
                                {currency &&
                                  formatAmountInCentsAsCurrencyString(
                                    getInvestmentValueByType(investmentType),
                                    currency
                                  )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="font-bold">Allocation</label>

                  {selectedInvestmentTypes.length === 0 && <p>No investment types selected</p>}
                  {selectedInvestmentTypes.length > 0 && (
                    <>
                      <table className="whitespace-normal border border-collapse">
                        <thead>
                          <tr className="">
                            <th className="w-[300px]">Investment type</th>
                            <th className="">Before</th>
                            <th className="">Desired</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvestmentTypes.map((investmentType, index) => {
                            // Passing "" instead of null because https://github.com/s-yadav/react-number-format/issues/727
                            const beforeWeight = beforeWeightsByInvestmentType.get(investmentType) ?? "";
                            const desiredWeight = desiredWeightsByInvestmentType.get(investmentType) ?? "";

                            return (
                              <tr key={investmentType} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                <td>{labelsByInvestmentType[investmentType]}</td>
                                <td>~{beforeWeight}%</td>
                                <td>
                                  <NumericFormat
                                    decimalScale={0}
                                    className="h-auto p-0"
                                    min="1"
                                    max="100"
                                    value={desiredWeight}
                                    placeholder="%"
                                    suffix="%"
                                    onValueChange={(values, _) => {
                                      const value = values.floatValue;
                                      if (value) {
                                        setDesiredWeightsByInvestmentType((prevState) => {
                                          const newState = new Map(prevState);
                                          newState.set(investmentType, value);
                                          return newState;
                                        });
                                      } else {
                                        setDesiredWeightsByInvestmentType((prevState) => {
                                          const newState = new Map(prevState);
                                          newState.delete(investmentType);
                                          return newState;
                                        });
                                      }
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {desiredWeightsByInvestmentTypeError && (
                        <div className="text-red-500">{desiredWeightsByInvestmentTypeError}</div>
                      )}
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <label className="font-bold">How to allocate deposit</label>

                  {renderHowToAllocateDepositOverInvestmentTypes()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}