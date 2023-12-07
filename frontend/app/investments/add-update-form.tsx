import { useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import DatePicker from "react-datepicker";

import moment from 'moment';
import { CurrencyInputOnChangeValues } from 'react-currency-input-field/dist/components/CurrencyInputProps';
import "react-datepicker/dist/react-datepicker.css";
import { api } from '../axios';
import { Button } from '../button';
import { decimalSeparatorsByCurrency, groupSeparatorsByCurrency, signPrefixesByCurrency } from '../settings/settings';

export interface CreateInvestmentUpdateRequest {
  date: string
  deposit?: number
  withdrawal?: number
  value: number
}

type AddUpdateFormProps = {
  onAdd: () => void
  investmentId: string
  currency: string
};

const AddUpdateForm: React.FC<AddUpdateFormProps> = ({
  onAdd,
  investmentId,
  currency
}) => {
  const [date, setDate] = useState<Date>();
  const [deposit, setDeposit] = useState<number>();
  const [withdrawal, setWithdrawal] = useState<number>();
  const [value, setValue] = useState<number>();

  const [errors, setErrors] = useState({
    date: '',
    value: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { date: "", value: "" };

    if (!date) {
      newErrors.date = 'Date is required';
      isValid = false;
    }
    if (!value) {
      newErrors.value = 'Value is required';
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

    const req: CreateInvestmentUpdateRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      deposit: deposit && Math.round(deposit! * 100),
      withdrawal: withdrawal && Math.round(withdrawal! * 100),
      value: Math.round(value! * 100),
    };

    api
      .post(`/investments/${investmentId}/updates`, req, {
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
      });
  };

  const handleDepositChange = (value: string | undefined, name?: string, values?: CurrencyInputOnChangeValues) => {
    if (values && values.float != null) {
      setDeposit(values.float);
    } else {
      setDeposit(undefined)
    }
  };

  const handleWithdrawalChange = (value: string | undefined, name?: string, values?: CurrencyInputOnChangeValues) => {
    if (values && values.float != null) {
      setWithdrawal(values.float);
    } else {
      setWithdrawal(undefined)
    }
  };

  const handleValueChange = (value: string | undefined, name?: string, values?: CurrencyInputOnChangeValues) => {
    if (values && values.float != null) {
      setValue(values.float);
    } else {
      setValue(undefined)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label>Date</label>
        <DatePicker
          className="border w-full p-2"
          wrapperClassName="w-full"
          placeholderText="YYYY-MM-DD"
          selected={date}
          onChange={(date) => date && setDate(date)}
          dateFormat="yyyy-MM-dd"
        />
        <div className="text-red-500">{errors.date}</div>
      </div>
      <div className="mb-4">
        <label>Deposit (optional)</label>
        <CurrencyInput
          className="border w-full px-2 py-2"
          prefix={signPrefixesByCurrency[currency]}
          placeholder={signPrefixesByCurrency[currency]}
          decimalsLimit={2}
          onValueChange={handleDepositChange}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
      </div>
      <div className="mb-4">
        <label>Withdrawal (optional)</label>
        <CurrencyInput
          className="border w-full px-2 py-2"
          prefix={signPrefixesByCurrency[currency]}
          placeholder={signPrefixesByCurrency[currency]}
          decimalsLimit={2}
          onValueChange={handleWithdrawalChange}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
      </div>
      <div className="mb-4">
        <label>Value</label>
        <CurrencyInput
          className="border w-full px-2 py-2"
          prefix={signPrefixesByCurrency[currency]}
          placeholder={signPrefixesByCurrency[currency]}
          decimalsLimit={2}
          onValueChange={handleValueChange}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
        <div className="text-red-500">{errors.value}</div>
      </div>
      <div>
        <Button className="w-full lg:w-auto ml-auto block" variant="primary" type="submit" disabled={submitting}>
          {submitting ? <span>Submitting...</span> : <span>Submit</span>}
        </Button>
      </div>
    </form>
  );
};

export default AddUpdateForm;