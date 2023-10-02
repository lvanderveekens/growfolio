import { ChangeEvent, useState } from 'react';
import DatePicker from "react-datepicker";

import CurrencyInput from 'react-currency-input-field';
import moment from 'moment';
import "react-datepicker/dist/react-datepicker.css";
import { Investment } from '../page';
import { TransactionType } from './transaction';
import { api } from '../axios';
import { CurrencyInputOnChangeValues } from 'react-currency-input-field/dist/components/CurrencyInputProps';


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
  const [amount, setAmount] = useState<number>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const req: CreateTransactionRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      type: type!,
      investmentId: investmentId,
      amount: amount! * 100,
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
            prefix="€ "
            placeholder="€ "
            decimalsLimit={2}
            onValueChange={handleAmountChange}
            groupSeparator="."
            decimalSeparator=","
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