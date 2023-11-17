import { useState } from 'react';
import { InvestmentType, labelsByInvestmentType } from '../investment-type';
import { api } from '../axios';
import Dropdown from '../dropdown';
import { useRouter } from "next/navigation";
import { Button } from '../button';

export interface CreateInvestmentRequest {
  type: InvestmentType;
  name: string;
}

type AddInvestmentFormProps = {
};

const AddInvestmentForm: React.FC<AddInvestmentFormProps> = () => {
  const router = useRouter()

  const [type, setType] = useState<InvestmentType>();
  const [name, setName] = useState<string>();

  const [errors, setErrors] = useState({
    type: '',
    name: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const validateForm = () => {
    let valid = true;
    const newErrors = { type: '', name: '' };

    if (!type) {
      newErrors.type = 'Type is required';
      valid = false;
    }
    if (!name || name.trim() === '') {
      newErrors.name = 'Name is required';
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
      })
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
      <Button
        type="submit"
        variant='primary'
        disabled={submitting}
      >
        {submitting ? <span>Submitting...</span> : <span>Submit</span>}
      </Button>
    </form>
  );
};

export default AddInvestmentForm;