import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import FHIR from 'fhirclient';

import { getPatient, getPatientVaccination, getUserRoles } from './utils/panoramaClient';
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
      // TODO: next version should use EMR FHIR storage
      const storage = client.environment.getStorage();

      const key = 'KEYCLOAK_TOKEN';
      const token = await storage.get(key);

      // should be the KeyCloak user credential for practitioner launching the viewer
      let username = 'thomas-lee';
      let password = 'ThomasL@1121';
      if (token) {
        console.log('keycloak token already exist:', token);
        validateToken(token).then(validated => {
          if (!validated) {
            // TODO: might redirect to login page
            console.log('token expired, fetch from KeyCloak (might redirect to login page first)');
            storage.unset(key);
            getToken(username, password).then(token => {
              console.log('token retrieved:', token);
              storage.set(key, token);
            });
          }
        });
      } else {
        // TODO: might redirect to login page
        console.log('keycloak token not yet exist, fetch from KeyCloak (might redirect to login page first)')
        getToken(username, password).then(token => {
          console.log('token retrieved:', token);
          storage.set(key, token);
        });
      }
    })
    .then(async () => {
      // user should be the one from login page?
      let user = 'PERMISSIONS';
      let roles = await getUserRoles('PERMISSIONS');

      // currently get the role from the first role in the list returned, might consider creating a specific role or ask during login
      console.log('practitioner roles from panorama api', roles)
      let role = roles[0].id;

      // should be same as patient selected during practitioner login
      let patient = 8362196;

      getPatient(user, role, patient).then(patient => console.log('patient from panorama api', patient));
      getPatientVaccination(user, role, patient).then(vaccination => console.log('patient vaccination from panorama api', vaccination));
    })
    .then(() => {
      let url = 'https://postman-echo.com/';
      fetch(url, {
        method: 'GET'
      })
      .then(response => console.log('status code for ssl/tls connection to "https://postman-echo.com": ', response.status));
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
