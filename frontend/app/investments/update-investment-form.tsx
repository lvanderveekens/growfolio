import { ChangeEvent, useState } from 'react';
import { Investment } from '../page';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';

export interface CreateInvestmentUpdateRequest {
  date: string
  investmentId: string
  value: number
}

type UpdateInvestmentFormProps = {
  onAdd: () => void
  investmentId: string
};

const UpdateInvestmentForm: React.FC<UpdateInvestmentFormProps> = ({
  onAdd,
  investmentId,
}) => {
  const [date, setDate] = useState<Date>();
  const [value, setValue] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const req: CreateInvestmentUpdateRequest = {
      date: moment(date).format("YYYY-MM-DD"),
      investmentId: investmentId,
      value: Math.round(parseFloat(value!) * 100),
    };

    const res = await fetch(`http://localhost:8888/v1/investment-updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    setDate(undefined);
    setValue(undefined)
    onAdd();
  };

  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9.]/g, "");
    setValue(numericValue);
  };

  return (
    <form onSubmit={handleSubmit}>
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
          <div>Value</div>
          <input
            className="border"
            type="text"
            value={value ?? ""}
            onChange={handleValueChange}
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

export default UpdateInvestmentForm;