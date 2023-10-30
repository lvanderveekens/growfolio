import { useState } from 'react';
import DatePicker from "react-datepicker";

import moment from 'moment';
import CurrencyInput from 'react-currency-input-field';
import { CurrencyInputOnChangeValues } from 'react-currency-input-field/dist/components/CurrencyInputProps';
import "react-datepicker/dist/react-datepicker.css";
import { api } from '../axios';
import { decimalSeparatorsByCurrency, groupSeparatorsByCurrency, signPrefixesByCurrency } from '../settings/settings';
import { TransactionType } from './transaction';


export interface CreateTransactionRequest {
  date: string;
  type: TransactionType;
  investmentId: string;
  amount: number;
}

type AddTransactionFormProps = {
  investmentId: string
  onAdd: () => void
  currency: string
};

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  investmentId,
  onAdd,
  currency,
}) => {
  const [date, setDate] = useState<Date>();
  const [type, setType] = useState<TransactionType>();
  const [amount, setAmount] = useState<number>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const req: CreateTransactionRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      type: type!,
      investmentId: investmentId,
      amount: amount! * 100,
    };

    await api.post("/transactions", req, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setDate(undefined)
    setType(undefined);
    setAmount(undefined);

    onAdd()
  };

  const handleAmountChange = (value: string | undefined, name?: string, values?: CurrencyInputOnChangeValues) => {
    if (values && values.float != null) {
      setAmount(values.float);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 w-full">
        <div>Date</div>
        <DatePicker
          wrapperClassName="w-full"
          className="border w-full"
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
            className="border w-full"
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
          <CurrencyInput
            className="border w-full"
            prefix={signPrefixesByCurrency[currency]}
            placeholder={signPrefixesByCurrency[currency]}
            decimalsLimit={2}
            onValueChange={handleAmountChange}
            groupSeparator={groupSeparatorsByCurrency[currency]}
            decimalSeparator={decimalSeparatorsByCurrency[currency]}
            required
          />
        </label>
      </div>

      <button className="border px-3 py-2 w-full sm:w-auto" type="submit">
        Submit
      </button>
    </form>
  );
};

export default AddTransactionForm;