import { ChangeEvent, useState } from 'react';
import { Investment } from './page';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

type UpdateInvestmentFormProps = {
  investments: Investment[]
};

const UpdateInvestmentForm: React.FC<UpdateInvestmentFormProps> = ({
  investments,
}) => {
  const [date, setDate] = useState<Date>();
  const [investment, setInvestment] = useState<Investment>();
  const [value, setValue] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const req: CreateInvestmentRequest = {
    //   type: type!,
    //   name: name!,
    // };

    // const res = await fetch(`http://localhost:8888/v1/investments`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(req),
    // });

    // setType(undefined);
    // setName(undefined);
  };

  const handleInvestmentChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setInvestment(JSON.parse(event.target.value));
  };

  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9.]/g, "");
    setValue(numericValue);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-xl font-bold mb-3">Update investment</h1>
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