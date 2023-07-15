import { useState } from 'react';
import { InvestmentType } from './investment-type';

export interface CreateInvestmentRequest {
  type: InvestmentType;
  name: string;
}

type AddInvestmentFormProps = {
  onAdd: () => void
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

    const res = await fetch(`http://localhost:8888/v1/investments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    setType(undefined);
    setName(undefined);

    onAdd()
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-xl font-bold mb-3">Add investment</h1>
      <div className="mb-3">
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
      <div className="mb-3">
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