import { ChangeEvent, useState } from 'react';

enum TransactionType {
  Buy = "buy",
  Sell = "sell",
}

enum InvestmentType {
  Stock = "stock",
  Bond = "bond",
  Commodity = "commodity",
  Fund = "fund",
  Crypto = "crypto",
  Cash = "cash",
}

const AddTransactionForm = () => {
  const [transactionType, setTransactionType] = useState<TransactionType | "">("");
  const [investmentType, setInvestmentType] = useState<InvestmentType | "">("");
  const [amount, setAmount] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform form submission logic here
    // console.log('Name:', name);
    // Reset form fields
    // setName('');
    // setEmail('');
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9.]/g, '');
    setAmount(numericValue);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className='text-xl font-bold mb-3'>Add transaction form</h1>
      <div className='mb-3'>
        <label>
          <div>Transaction type</div>
          <select
            className="border"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as TransactionType)}
          >
            <option value="" disabled>Select transaction type</option>
            {Object.entries(TransactionType).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className='mb-3'>
        <label>
          <div>Investment type</div>
          <select
            className="border"
            value={investmentType}
            onChange={(e) => setInvestmentType(e.target.value as InvestmentType)}
          >
            <option value="" disabled>Select investment type</option>
            {Object.entries(InvestmentType).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className='mb-3'>
        <label>
          <div>Amount</div>
          <input
            className="border"
            type="text"
            value={amount}
            onChange={handleAmountChange}
          />
        </label>
      </div>

      <button className="border px-3 py-2" type="submit">
        Submit
      </button>
    </form>
  );
};

export default AddTransactionForm;