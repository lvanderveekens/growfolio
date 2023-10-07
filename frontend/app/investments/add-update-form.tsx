import { ChangeEvent, useState } from 'react';
import { Investment } from '../page';
import DatePicker from "react-datepicker";
import CurrencyInput from 'react-currency-input-field';

import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import { api } from '../axios';
import { CurrencyInputOnChangeValues } from 'react-currency-input-field/dist/components/CurrencyInputProps';
import { decimalSeparatorsByCurrency, groupSeparatorsByCurrency, signPrefixesByCurrency } from '../settings/settings';

export interface CreateInvestmentUpdateRequest {
  date: string
  investmentId: string
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
  const [value, setValue] = useState<number>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const req: CreateInvestmentUpdateRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      investmentId: investmentId,
      value: value! * 100,
    };

    await api.post("/v1/investment-updates", req, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setDate(undefined);
    setValue(undefined)
    onAdd();
  };

  const handleValueChange = (value: string | undefined, name?: string, values?: CurrencyInputOnChangeValues) => {
    if (values && values.float != null) {
      setValue(values.float);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <div>Date</div>
        <DatePicker
          className="border w-full"
          wrapperClassName='w-full'
          selected={date}
          onChange={(date) => date && setDate(date)}
          dateFormat="yyyy-MM-dd"
          required
        />
      </div>
      <div className="mb-4">
        <label>
          <div>Value</div>
          <CurrencyInput
            className='border w-full'
            prefix={signPrefixesByCurrency[currency]}
            placeholder={signPrefixesByCurrency[currency]}
            decimalsLimit={2}
            onValueChange={handleValueChange}
            groupSeparator={groupSeparatorsByCurrency[currency]}
            decimalSeparator={decimalSeparatorsByCurrency[currency]}
            required
          />
        </label>
      </div>
      <button className="border w-full sm:w-auto px-3 py-2" type="submit">
        Submit
      </button>
    </form>
  );
};

export default AddUpdateForm;