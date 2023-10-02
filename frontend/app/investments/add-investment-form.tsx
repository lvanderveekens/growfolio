import { useState } from 'react';
import { InvestmentType } from '../investment-type';
import { api } from '../axios';

export interface CreateInvestmentRequest {
  type: InvestmentType;
  name: string;
}

type AddInvestmentFormProps = {
  onAdd: (investmentId: string) => void
};

const AddInvestmentForm: React.FC<AddInvestmentFormProps> = ({ onAdd }) => {
  const [type, setType] = useState<InvestmentType>();
  const [name, setName] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const req: CreateInvestmentRequest = {
      type: type!,
      name: name!,
    };

    api.post("/v1/investments", req, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      if (res.status !== 201) {
        console.error(`unexpected response ${res.status}`)
        return
      }
      onAdd(res.data.id);
    })
    .catch((err) => console.error(err))
    .finally(() => {
      setType(undefined);
      setName(undefined);
    })
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2">
        <label>
          <div>Type</div>
          <select
            className="border"
            value={type || ""}
            onChange={(e) => setType(e.target.value as InvestmentType)}
            required 
          >
            <option value="" disabled>
              Select type
            </option>
            {Object.entries(InvestmentType).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-2">
        <label>
          <div>Name</div>
          <input
            className="border"
            type="text"
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
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

export default AddInvestmentForm;