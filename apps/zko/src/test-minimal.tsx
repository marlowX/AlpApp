import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// MINIMALNY TEST - tylko React i HTML select
const MinimalApp = () => {
  const [value, setValue] = useState('');
  const [dateValue, setDateValue] = useState('');

  return (
    <div style={{ padding: '20px' }}>
      <h1>Minimalny test - czysty HTML</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>HTML Select: </label>
        <select 
          value={value} 
          onChange={(e) => {
            console.log('Select changed:', e.target.value);
            setValue(e.target.value);
          }}
          style={{ padding: '5px', width: '200px' }}
        >
          <option value="">-- Wybierz --</option>
          <option value="1">Opcja 1</option>
          <option value="2">Opcja 2</option>
          <option value="3">Opcja 3</option>
        </select>
        <p>Wybrana wartość: {value || 'brak'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>HTML Date Input: </label>
        <input 
          type="date"
          value={dateValue}
          onChange={(e) => {
            console.log('Date changed:', e.target.value);
            setDateValue(e.target.value);
          }}
          style={{ padding: '5px', width: '200px' }}
        />
        <p>Wybrana data: {dateValue || 'brak'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => {
            console.log('Button clicked!');
            alert('Button działa!');
          }}
          style={{ padding: '10px', cursor: 'pointer' }}
        >
          Test Button
        </button>
      </div>

      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f0f0f0',
        marginTop: '20px',
        border: '1px solid #d0d0d0'
      }}>
        <h3>Debug Info:</h3>
        <ul>
          <li>React version: {React.version}</li>
          <li>Window object exists: {typeof window !== 'undefined' ? '✅' : '❌'}</li>
          <li>Document object exists: {typeof document !== 'undefined' ? '✅' : '❌'}</li>
          <li>Console object exists: {typeof console !== 'undefined' ? '✅' : '❌'}</li>
        </ul>
        <p>Otwórz konsolę (F12) i sprawdź czy są jakieś błędy!</p>
      </div>
    </div>
  );
};

// Renderuj bezpośrednio bez żadnych providerów
ReactDOM.createRoot(document.getElementById('root')!).render(<MinimalApp />);
