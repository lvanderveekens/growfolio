import { useState } from 'react';
import { InvestmentType, labelsByInvestmentType } from '../investment-type';
import { api } from '../axios';
import Dropdown from '../dropdown';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import { Button } from '../button';
import CurrencyInput from 'react-currency-input-field';
import { decimalSeparatorsByCurrency, groupSeparatorsByCurrency, signPrefixesByCurrency } from '../settings/settings';
import moment from 'moment';

export interface CreateInvestmentRequest {
  type: InvestmentType;
  name: string;
  initialDate?: string;
  initialCost?: number;
  initialValue?: number;
}

type AddInvestmentFormProps = {
  currency: string
};

const AddInvestmentForm: React.FC<AddInvestmentFormProps> = ({ currency }) => {
  const router = useRouter();

  const [type, setType] = useState<InvestmentType>();
  const [name, setName] = useState<string>();
  const [initialDate, setInitialDate] = useState<Date>();
  const [initialCost, setInitialCost] = useState<number>();
  const [initialValue, setInitialValue] = useState<number>();

  const [errors, setErrors] = useState({
    type: "",
    name: "",
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const validateForm = () => {
    let valid = true;
    const newErrors = { type: "", name: ""};

    if (!type) {
      newErrors.type = "Type is required";
      valid = false;
    }
    if (!name || name.trim() === "") {
      newErrors.name = "Name is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const req: CreateInvestmentRequest = {
      type: type!,
      name: name!,
      initialDate: moment(initialDate).format("YYYY-MM-DD"),
      initialCost: initialCost,
      initialValue: initialValue,
    };

    api
      .post("/investments", req, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        if (res.status !== 201) {
          console.error(`unexpected response ${res.status}`);
          return;
        }
        router.push(`/investments/${res.data.id}`);
      })
      .catch((err) => {
        console.error(err);
        setSubmitting(false);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label>Type</label>
        <Dropdown
          className="w-full"
          placeholder="Select a type"
          selected={
            type && {
              label: labelsByInvestmentType[type],
              value: type,
            }
          }
          onChange={(option) => setType(option.value)}
          options={Object.values(InvestmentType).map((value) => ({
            label: labelsByInvestmentType[value],
            value: value,
          }))}
        />
        <div className="text-red-500">{errors.type}</div>
      </div>
      <div className="mb-4">
        <label>
          <div>Name</div>
          <input
            className="w-full"
            type="text"
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="text-red-500">{errors.name}</div>
      </div>
      <div className="mb-4">
        <div>Initial date (optional)</div>
        <DatePicker
          className="border w-full p-2"
          wrapperClassName="w-full"
          placeholderText="YYYY-MM-DD"
          selected={initialDate}
          onChange={(date) => date && setInitialDate(date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>
      <div className="mb-4">
        <label>Initial cost (optional)</label>
        <CurrencyInput
          className="border w-full px-2 py-2"
          prefix={signPrefixesByCurrency[currency]}
          placeholder={signPrefixesByCurrency[currency]}
          decimalsLimit={2}
          onValueChange={(value, name, values) => {
            if (values && values.float) {
              setInitialCost(Math.round(values.float * 100));
            }
          }}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
      </div>
      <div className="mb-4">
        <label>Initial value (optional)</label>
        <CurrencyInput
          className="border w-full px-2 py-2"
          prefix={signPrefixesByCurrency[currency]}
          placeholder={signPrefixesByCurrency[currency]}
          decimalsLimit={2}
          onValueChange={(value, name, values) => {
            if (values && values.float) {
              setInitialValue(Math.round(values.float * 100));
            }
          }}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
      </div>
      <div>
        <Button
          className="w-full lg:w-auto ml-auto block"
          type="submit"
          variant="primary"
          disabled={submitting}
        >
          {submitting ? <span>Adding...</span> : <span>Add</span>}
        </Button>
      </div>
    </form>
  );
};

export default AddInvestmentForm;