import { useState } from 'react';
import DatePicker from "react-datepicker";

import moment from 'moment';
import CurrencyInput from 'react-currency-input-field';
import { CurrencyInputOnChangeValues } from 'react-currency-input-field/dist/components/CurrencyInputProps';
import "react-datepicker/dist/react-datepicker.css";
import { api } from '../axios';
import { decimalSeparatorsByCurrency, groupSeparatorsByCurrency, signPrefixesByCurrency } from '../settings/settings';
import { TransactionType, labelsByTransactionType } from './transaction';
import Dropdown from '../dropdown';


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

  const [errors, setErrors] = useState({
    date: '',
    type: '',
    amount: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { date: '', type: '' , amount: ''};

    if (!date) {
      newErrors.date = 'Date is required';
      isValid = false;
    }
    if (!type) {
      newErrors.type = 'Type is required';
      isValid = false;
    }
    if (!amount) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const req: CreateTransactionRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      type: type!,
      investmentId: investmentId,
      amount: amount! * 100,
    };

    api
      .post("/transactions", req, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(() => {
        onAdd();
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setSubmitting(false);
      })
  };

  const handleAmountChange = (value: string | undefined, name?: string, values?: CurrencyInputOnChangeValues) => {
    if (values && values.float != null) {
      setAmount(values.float);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <div>Date</div>
        <DatePicker
          className="border w-full px-4 py-2"
          wrapperClassName="w-full"
          selected={date}
          onChange={(date) => date && setDate(date)}
          dateFormat="yyyy-MM-dd"
        />
        <div className="text-red-500">{errors.date}</div>
      </div>
      <div className="mb-4">
        <label>Type</label>
        <Dropdown
          className="w-full"
          placeholder="Select a type"
          selected={
            type && {
              label: labelsByTransactionType[type],
              value: type,
            }
          }
          onChange={(option) => setType(option.value)}
          options={Object.values(TransactionType).map((value) => ({
            label: labelsByTransactionType[value],
            value: value,
          }))}
        />
        <div className="text-red-500">{errors.type}</div>
      </div>
      <div className="mb-4">
        <label>Amount</label>
        <CurrencyInput
          className="border w-full px-4 py-2"
          prefix={signPrefixesByCurrency[currency]}
          placeholder={signPrefixesByCurrency[currency]}
          decimalsLimit={2}
          onValueChange={handleAmountChange}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
        <div className="text-red-500">{errors.amount}</div>
      </div>

      <button
        className="border px-3 py-2 disabled:opacity-50"
        type="submit"
        disabled={submitting}
      >
        {submitting ? <span>Submitting...</span> : <span>Submit</span>}
      </button>
    </form>
  );
};

export default AddTransactionForm;