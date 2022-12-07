import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import FHIR from 'fhirclient';

//import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
//root.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>
//);
//const rootElement = document.getElementById('root');

const smartLaunch = () => {
  // Authorize application
  FHIR.oauth2
    .init({
      clientId: 'Input client id you get when you register the app',
      scope: 'launch/patient openid profile'
    })
    .then(client => {
      console.log(client);
      client.request(client.user.fhirUser).then(practitioner => console.log(practitioner));
      client.request(`Patient/${client.patient.id}`).then(patient => console.log(patient));

      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      //ReactDOM.render(<App client={client} />, rootElement);
    });
};

smartLaunch();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
