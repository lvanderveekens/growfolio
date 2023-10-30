import { useState } from 'react';

import "react-datepicker/dist/react-datepicker.css";
import { api } from '../axios';

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
    const response = await api.post(`/investments/${investmentId}/updates`, formData, {
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
        <div className=''>Provide a CSV that complies with the following format:</div>
        <div className="p-4 text-white bg-black">
          <div>Date,ValueInCents</div>
          <div>2023-08-01,2000</div>
          <div>2023-08-09,5000</div>
          <div>2023-08-17,12000</div>
        </div>
      </div>
      <div className="mb-4">
        <label className="block" htmlFor="csvFile">CSV file</label>
        <input
          type="file"
          id="csvFile"
          name="csvFile"
          accept=".csv"
          onChange={handleCsvFileChange}
          required
        />
      </div>
      <button className="border w-full sm:w-auto px-3 py-2" type="submit">
        Import
      </button>
    </form>
  );
};

export default ImportUpdatesForm;