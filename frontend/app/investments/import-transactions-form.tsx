import { useState } from 'react';

import "react-datepicker/dist/react-datepicker.css";
import { api } from '../axios';

type ImportTransactionsFormProps = {
  onImport: () => void
  investmentId: string
};

const ImportTransactionsForm: React.FC<ImportTransactionsFormProps> = ({
  onImport,
  investmentId,
}) => {
  const [csvFile, setCsvFile] = useState();

  const handleCsvFileChange = (event) => {
    const file = event.target.files[0];
    setCsvFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('csvFile', csvFile);

    // Make a POST request using Axios
    const response = await api.post(`/v1/investments/${investmentId}/transactions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    setCsvFile(undefined);
    onImport();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <div className="">
          Provide a CSV that complies with the following format:
        </div>
        <div className="p-3 text-white bg-black">
          <div>Date,Type,AmountInCents</div>
          <div>2023-08-01,buy,10</div>
          <div>2023-08-09,buy,100</div>
          <div>2023-08-17,buy,90</div>
        </div>
      </div>
      <div className="mb-3">
        <label className="block" htmlFor="csvFile">
          CSV file
        </label>
        <input
          type="file"
          id="csvFile"
          name="csvFile"
          accept=".csv"
          onChange={handleCsvFileChange}
          required
        />
      </div>
      <button className="border px-3 py-2" type="submit">
        Import
      </button>
    </form>
  );
};

export default ImportTransactionsForm;