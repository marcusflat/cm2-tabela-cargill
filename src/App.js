import { useState, useEffect, useRef } from 'react';

import IntlCurrencyInput from "react-intl-currency-input";

import './App.css';
import { PLANTS, PRICE_PER_KM, GRIS_ADVALOREM, ICMS_FROM_SP, CARGILL_LOGO, ABECOM_LOGO, CM2_LOGO } from './constants';
import { inlayTax } from './utils';

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
  const [ totalFreightValue, setTotalFreightValue ] = useState(0);
  const [ freightValue, setFreightValue ] = useState(0);
  const [ insuranceValue, setInsuranceValue ] = useState(0);
  const [ taxValue, setTaxValue ] = useState(0);
  const checkboxRef = useRef();

  const freightValuesIsValid = totalFreightValue !== 0 && !isNaN(totalFreightValue);
  const setFreightValueToZero = () => setTotalFreightValue(0);

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
    const { distance, state } = selectedPlant;
    const tax = ICMS_FROM_SP[state];
    const hasExtraCharge = checkboxRef.current.checked;
    const kmPrice = hasExtraCharge ? PRICE_PER_KM * 1.5 : PRICE_PER_KM;

    const totalKmPrice = distance * kmPrice;
    const insurancePrice = invoiceValue * (GRIS_ADVALOREM / 100);
    const freightValue = totalKmPrice + insurancePrice;
    const freightValueWithTax = inlayTax(freightValue, tax);

    setTotalFreightValue(freightValueWithTax);
    setFreightValue(totalKmPrice);
    setInsuranceValue(insurancePrice);
    setTaxValue(freightValueWithTax * (tax / 100));
  }

  return (
    <div className="app">
      <div className="wrapper">
        <Header />
        {freightValuesIsValid ? (
          <FreightDescription
            totalFreightValue={totalFreightValue}
            freightValue={freightValue}
            insuranceValue={insuranceValue}
            taxValue={taxValue}
            selectedPlant={selectedPlant}
            onButtonClick={() => setTotalFreightValue(0)}
          />
        ): (
          <Form
            onChangeCity={selectCity}
            cities={cities}
            onPlantChange={selectPlant}
            plants={plants}
            onInvoiceChange={handleInvoiceValue}
            checkboxRef={checkboxRef}
            onCheckboxClick={handleCheckboxClick}
            onButtonClick={calculateFreight}
          />
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <>
      <div className="logos-container">
        <div className="logo-wrapper">
          <img className="logo" alt="logo-abecom" src={ABECOM_LOGO}/>
        </div>
        <div className="logo-wrapper">
          <img className="logo logo-cm2" alt="logo-cm2" src={CM2_LOGO}/>
        </div>
        <div className="logo-wrapper">
          <img className="logo" alt="logo-cargill" src={CARGILL_LOGO}/>
        </div>
      </div>

      <div className="title-wrapper"> 
        <h1 className="title">Simulador de Frete</h1>
        <h2 className="sub-title">Emergencial Cargill</h2>
      </div>
    </>
  )
}

function Form({
  onChangeCity,
  cities,
  onPlantChange,
  plants,
  onInvoiceChange,
  checkboxRef,
  onCheckboxClick,
  onButtonClick,
}) {
  return (
    <div>
      <InputWrapper
        label="Cidade"
        Input={
          <Select
            name="city"
            onChange={onChangeCity}
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
            onChange={onPlantChange}
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
            onChange={onInvoiceChange}
          />
        }
      />

      <div>
        <input className="checkbox" type="checkbox" id="extra-charge" name="extra-charge" ref={checkboxRef} onClick={onCheckboxClick}/>
        <label className="label-checkbox" htmlFor="extra-charge">Entrega será realizada fora do horário comercial, final de semana ou feriado.</label>
      </div>

      <button className="button" onClick={onButtonClick}>Calcular</button>
    </div>
  );
}

function FreightDescription({ totalFreightValue, selectedPlant, insuranceValue, taxValue, freightValue, onButtonClick }) {
  return (
    <>
      <div className="freight-description-box">
        <p className="text text--dark">Planta (destino):</p>
        <div className="card">
          <p className="text text--dark">{selectedPlant?.name} - {selectedPlant?.street} - {selectedPlant?.city} - {selectedPlant?.state}</p>
        </div>
        <p className="text text--dark">Prazo de Entrega:</p>
        <div className="card">
          <p className="text text--dark">{selectedPlant?.leadTime} horas (após a coleta)</p>
        </div>
        <p className="text text--dark">Valor Total:</p>
        <div className="card">
          <p className="text text--dark">{formatter.format(totalFreightValue)}</p>
        </div>
        <ul className="list">
          <li><p className="text text--dark">Frete: {formatter.format(freightValue)}</p></li>
          <li><p className="text text--dark">Gris / Advalorem: {formatter.format(insuranceValue)}</p></li>
          <li><p className="text text--dark">ICMS: {formatter.format(taxValue)}</p></li>
        </ul>
      </div>
      <button className="button" onClick={onButtonClick}>Simular novamente</button>
    </>
  );
}

export default App;
