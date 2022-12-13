import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import FHIR from 'fhirclient';

import { getPatient, getPatientImmunization } from './utils/panoramaClient';

//import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
//root.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>
//);
//const rootElement = document.getElementById('root');

function getKeycloakToken() {
  let url = 'http://localhost:8080/realms/cambianpanoramaviewer/protocol/openid-connect/token';

  let body = new URLSearchParams({
    'client_id': 'viewer',
    'grant_type': 'password',
    'username': 'thomas-lee',
    'password': 'ThomasL@1121'
  });

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Origin': 'http://localhost:3000'
    },
    body: body
  })
  .then(response => response.json());
}

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
    })
    .then(() => {
      getPatient(8362196).then(patient => console.log('patient from panorama api', patient));
      getPatientImmunization(8362196).then(immunization => console.log('patient immunization from panorama api', immunization));
    })
    .then(() => {
      getKeycloakToken().then(data => console.log(data))
    })
    .then(() => {
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
