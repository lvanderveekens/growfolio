import { ChangeEvent, useState } from 'react';
import DatePicker from "react-datepicker";

import moment from 'moment';
import "react-datepicker/dist/react-datepicker.css";
import { Investment } from '../page';
import { TransactionType } from './transaction';
import { api } from '../axios';


export interface CreateTransactionRequest {
  date: string;
  type: TransactionType;
  investmentId: string;
  amount: number;
}

type AddTransactionFormProps = {
  investmentId: string
  onAdd: () => void
};

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  investmentId,
  onAdd,
}) => {
  const [date, setDate] = useState<Date>();
  const [type, setType] = useState<TransactionType>();
  const [amount, setAmount] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const req: CreateTransactionRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      type: type!,
      investmentId: investmentId,
      amount: Math.round(parseFloat(amount!) * 100),
    };

    await api.post("/v1/transactions", req, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setDate(undefined)
    setType(undefined);
    setAmount(undefined);

    onAdd()
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9.]/g, "");
    setAmount(numericValue);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <div>Date</div>
        <DatePicker
          className="border"
          selected={date}
          onChange={(date) => date && setDate(date)}
          dateFormat="yyyy-MM-dd"
          required
        />
      </div>
      <div className="mb-4">
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
      <div className="mb-4">
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