import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import FHIR from 'fhirclient';

import { getPatient, getPatientVaccination } from './utils/panoramaClient';
import { getToken, validateToken } from './utils/keycloakClient';

const root = ReactDOM.createRoot(document.getElementById('root'));

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

      return client;
    })
    .then(async client => {
      const storage = client.environment.getStorage();

      const key = 'KEYCLOAK_TOKEN';
      const token = await storage.get(key);

      if (token) {
        console.log('keycloak token already exist:', token);
        validateToken(token).then(validated => {
          if (!validated) {
            console.log('token expired, fetch from KeyCloak');
            storage.unset(key);
            getToken().then(token => {
              console.log('token retrieved:', token);
              storage.set(key, token);
            });
          }
        });
      } else {
        console.log('keycloak token not yet exist, fetch from KeyCloak')
        getToken().then(token => {
          console.log('token retrieved:', token);
          storage.set(key, token);
        });
      }
    })
    .then(() => {
      getPatient(8362196).then(patient => console.log('patient from panorama api', patient));
      getPatientVaccination(8362196).then(vaccination => console.log('patient vaccination from panorama api', vaccination));
    })
    .then(() => {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    });
};

smartLaunch();
