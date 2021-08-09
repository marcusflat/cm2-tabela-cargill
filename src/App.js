import { useState, useEffect, useRef } from 'react';

import IntlCurrencyInput from "react-intl-currency-input";

import './App.css';
import { PLANTS, PRICE_PER_KM, GRIS_ADVALOREM, TAX } from './MOCK';

const currencyConfig = {
  locale: "pt-BR",
  formats: {
    number: {
      BRL: {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
  },
};

var formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function InputWrapper({ label, Input }) {
  return (
    <div className="input-wrapper">
      <label className="label" htmlFor="city">{label}</label>
      {Input}
    </div>
  );
}

function Select ({ children, onChange, name }) {
  return (
    <select className="select" name={name} onChange={onChange}>
      {children}
    </select>
  );
}

function App() {
  const [ cities, setCities ] = useState([]);
  const [ selectedCity, setSelectedCity ] = useState('');
  const [ plants, setPlants ] = useState([]);
  const [ selectedPlant, setSelectedPlant ] = useState(false);
  const [ invoiceValue, setInvoiceValue ] = useState(0);
  const [ freightValue, setFreightValue ] = useState(0);
  const checkboxRef = useRef();

  const freightValuesIsValid = freightValue !== 0 && !isNaN(freightValue);
  const setFreightValueToZero = () => setFreightValue(0);

  useEffect(() => {
    setCities(() =>
      [ ...PLANTS.reduce((acc, { city }) => acc.add(city), new Set()) ]
      .sort((a, b) => a.localeCompare(b)));
  }, []);

  useEffect(() => {
    setPlants(() => PLANTS.filter(plant => plant.city === selectedCity))
  }, [ selectedCity ]);

  const selectCity = ({ target: { value } }) => {
    setSelectedCity(value);
    setFreightValueToZero();
  }

  const selectPlant = ({ target: { value } }) => {
    setSelectedPlant(() => {
      const [ newSelectedPlant ] = plants.filter(({ id }) => `${id}` === value);
      return newSelectedPlant;
    });
    setFreightValueToZero();
  }

  const handleInvoiceValue = (event, value, maskedValue) => {
    event.preventDefault();
    setInvoiceValue(value);
    setFreightValueToZero();
  };

  const handleCheckboxClick = () => setFreightValueToZero();

  const calculateFreight = () => {
    const { distance } = selectedPlant;
    const hasExtraCharge = checkboxRef.current.checked;
    const kmPrice = hasExtraCharge ? PRICE_PER_KM * 1.5 : PRICE_PER_KM;

    const totalKmPrice = distance * kmPrice;
    const insurancePrice = invoiceValue * (GRIS_ADVALOREM / 100);
    const freightValue = totalKmPrice + insurancePrice;
    const freightValueWithTax = freightValue / (1 - (TAX / 100))
    
    setFreightValue(freightValueWithTax);
  }

  return (
    <div className="app">
      <div className="wrapper">

        <div className="logos-container">
          <div className="logo-wrapper">
            <img className="logo logo-cm2" alt="logo-cm2" src="https://assets.website-files.com/5f8dfe6a168d572c49c466fe/5f8e08afdcb626789742f50b_ico-logo-cm2.svg"/>
          </div>
          <div className="logo-wrapper">
            <img className="logo" alt="logo-abecom" src="https://www.abecom.com.br/wp-content/uploads/2020/09/logo-novo.png"/>
          </div>
        </div>

        <div className="title-wrapper"> 
          <h1 className="title">Simulador de Frete</h1>
          <h2 className="sub-title">Emergencial Cargil</h2>
        </div>
        
        <InputWrapper
          label="Cidade"
          Input={
            <Select
              name="city"
              onChange={selectCity}
            >
              <option>Selecione a cidade</option>
              {cities.map((city) =>(
                <option key={city}>{city}</option>
              ))}
            </Select>
          }
        />

        <InputWrapper
          label="Planta"
          Input={
            <Select
              name="plant"
              onChange={selectPlant}
            >
              <option>Selecione a planta</option>
              {plants.map((plant) =>(
                <option key={plant.id} value={plant.id}>{plant.name}</option>
              ))}
            </Select>
          }
        />

        <InputWrapper 
          label="Valor da nota fiscal"
          Input={
            <IntlCurrencyInput
              className="input-text"
              currency="BRL"
              config={currencyConfig}
              onChange={handleInvoiceValue}
            />
          }
        />

        <div>
          <input className="checkbox" type="checkbox" id="extra-charge" name="extra-charge" ref={checkboxRef} onClick={handleCheckboxClick}/>
          <label className="label-checkbox" htmlFor="extra-charge">Entrega será realizada fora do horário comercial, final de semana ou feriado?</label>
        </div>

        <button className="button" onClick={calculateFreight}>Calcular</button>
        
        <div className="text-wrapper">
          {freightValuesIsValid && (
            <>
              <p className="text">Valor do Frete: {formatter.format(freightValue)}</p>
              <p className="text">Prazo: {selectedPlant?.leadTime} horas</p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
