import { ChangeEvent, useState } from 'react';
import { Investment } from './page';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';


export enum TransactionType {
  Buy = "buy",
  Sell = "sell",
}

export interface CreateTransactionRequest {
  date: string
  type: TransactionType
  investmentId: string
  amount: number
}

type AddTransactionFormProps = {
  onAdd: () => void
  investments: Investment[]
};

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  onAdd,
  investments,
}) => {
  const [date, setDate] = useState<Date>();
  const [type, setType] = useState<TransactionType>();
  const [investment, setInvestment] = useState<Investment>();
  const [amount, setAmount] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const req: CreateTransactionRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      type: type!,
      investmentId: investment!.id,
      amount: Math.round(parseFloat(amount!) * 100),
    };

    await fetch(`http://localhost:8888/v1/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    setDate(undefined)
    setType(undefined);
    setInvestment(undefined);
    setAmount(undefined);

    onAdd()
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9.]/g, "");
    setAmount(numericValue);
  };

  const handleInvestmentChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setInvestment(JSON.parse(event.target.value));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-xl font-bold mb-3">Add transaction</h1>
      <div className="mb-3">
        <div>Date</div>
        <DatePicker
          className="border"
          selected={date}
          onChange={(date) => date && setDate(date)}
          dateFormat="yyyy-MM-dd"
          required
        />
      </div>
      <div className="mb-3">
        <label>
          <div>Type</div>
          <select
            className="border"
            value={type ?? ""}
            onChange={(e) => setType(e.target.value as TransactionType)}
            required
          >
            <option value="" disabled>
              Select type
            </option>
            {Object.entries(TransactionType).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-3">
        <label>
          <div>Investment</div>
          <select
            className="border"
            value={(investment && JSON.stringify(investment)) ?? ""}
            onChange={handleInvestmentChange}
            required
          >
            <option value="" disabled>
              Select investment
            </option>
            {investments.map((investment) => (
              <option key={investment.id} value={JSON.stringify(investment)}>
                {investment.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-3">
        <label>
          <div>Amount</div>
          <input
            className="border"
            type="text"
            value={amount ?? ""}
            onChange={handleAmountChange}
            required
          />
        </label>
      </div>

      <button className="border px-3 py-2" type="submit">
        Submit
      </button>
    </form>
  );
};

export default AddTransactionForm;