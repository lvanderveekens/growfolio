import { useState } from 'react';
import { InvestmentType } from './investment-type';

const AddInvestmentForm = () => {
  const [type, setType] = useState<InvestmentType | "">("");
  const [name, setName] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform form submission logic here
    // console.log('Name:', name);
    // Reset form fields
    // setName('');
    // setEmail('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-xl font-bold mb-3">Add investment</h1>
      <div className="mb-3">
        <label>
          <div>Type</div>
          <select
            className="border"
            value={type}
            onChange={(e) => setType(e.target.value as InvestmentType)}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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