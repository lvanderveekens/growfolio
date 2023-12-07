import { useState } from 'react';

import "react-datepicker/dist/react-datepicker.css";
import { api } from '../axios';
import { Button } from '../button';

type ImportUpdatesFormProps = {
  onImport: () => void
  investmentId: string
};

const ImportUpdatesForm: React.FC<ImportUpdatesFormProps> = ({
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
    const response = await api.post(`/investments/${investmentId}/updates/csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    setCsvFile(undefined);
    onImport();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <div className="mb-4">
          Provide a CSV that complies with the following format:
        </div>
        <div className="p-4 mb-4 text-white bg-black overflow-x-auto">
          <div>Date,Deposit,Withdrawal,Value</div>
          <div>2023-08-01,100,50,2000</div>
          <div>2023-08-09,100,50,5000</div>
          <div>2023-08-17,100,50,12000</div>
        </div>
        <div className="mb-4">
          Notice that the amounts are in cents.
        </div>
      </div>
      <div className="mb-4">
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
      <div>
        <Button
          className="w-full lg:w-auto block ml-auto"
          variant="primary"
          type="submit"
        >
          Import
        </Button>
      </div>
    </form>
  );
};

export default ImportUpdatesForm;