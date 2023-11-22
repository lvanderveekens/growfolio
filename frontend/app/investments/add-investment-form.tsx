import { useState } from 'react';
import { InvestmentType, labelsByInvestmentType } from '../investment-type';
import { api } from '../axios';
import Dropdown from '../dropdown';
import { useRouter } from "next/navigation";
import { Button } from '../button';
import CurrencyInput from 'react-currency-input-field';
import { decimalSeparatorsByCurrency, groupSeparatorsByCurrency, signPrefixesByCurrency } from '../settings/settings';

export interface CreateInvestmentRequest {
  type: InvestmentType;
  name: string;
  initialPrincipal?: number
  initialValue?: number
}

type AddInvestmentFormProps = {
  currency: string
};

const AddInvestmentForm: React.FC<AddInvestmentFormProps> = ({ currency }) => {
  const router = useRouter();

  const [type, setType] = useState<InvestmentType>();
  const [name, setName] = useState<string>();
  const [initialPrincipal, setInitialPrincipal] = useState<number>();
  const [initialValue, setInitialValue] = useState<number>();

  const [errors, setErrors] = useState({
    type: "",
    name: "",
    initialPrincipal: "",
    initialValue: "",
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const validateForm = () => {
    let valid = true;
    const newErrors = { type: "", name: "", initialPrincipal: "", initialValue: "" };

    if (!type) {
      newErrors.type = "Type is required";
      valid = false;
    }
    if (!name || name.trim() === "") {
      newErrors.name = "Name is required";
      valid = false;
    }
    // if (!initialPrincipal) {
    //   newErrors.initialPrincipal = "Initial principal is required";
    //   valid = false;
    // }
    // if (!initialValue) {
    //   newErrors.initialValue = "Initial value is required";
    //   valid = false;
    // }

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
      initialPrincipal: initialPrincipal,
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
        <label>Initial principal (optional)</label>
        <CurrencyInput
          className="border w-full px-2 py-2"
          prefix={signPrefixesByCurrency[currency]}
          placeholder={signPrefixesByCurrency[currency]}
          decimalsLimit={2}
          onValueChange={(value, name, values) => {
            if (values && values.float) {
              setInitialPrincipal(values.float * 100);
            }
          }}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
        <div className="text-red-500">{errors.initialPrincipal}</div>
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
              setInitialValue(values.float * 100);
            }
          }}
          groupSeparator={groupSeparatorsByCurrency[currency]}
          decimalSeparator={decimalSeparatorsByCurrency[currency]}
        />
        <div className="text-red-500">{errors.initialValue}</div>
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