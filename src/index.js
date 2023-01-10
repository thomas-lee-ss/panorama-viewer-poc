import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import FHIR from 'fhirclient';

import { getPatient, getPatientVaccination, getUserRoles } from './utils/panoramaClient';
import { getToken, validateToken } from './utils/tokenClient';
import { searchUser, deleteUser, createUser } from './utils/keycloakClient';

const rootElement = document.getElementById('root');

const https = require('https');

async function fetchToken(client) {
  // TODO: next version should use EMR FHIR storage
  const storage = client.environment.getStorage();

  const key = 'KEYCLOAK_TOKEN';
  let token = await storage.get(key);

  // should be the KeyCloak user credential for practitioner launching the viewer
  let username = 'thomas-lee';
  let password = 'ThomasL@1121';
  if (token) {
    const validated = await validateToken(token);
    if (!validated) {
      // TODO: might redirect to login page
      storage.unset(key);
      token = await getToken(username, password);
      storage.set(key, token);
    }
  } else {
    // TODO: might redirect to login page
    token = await getToken(username, password);
    storage.set(key, token);
  }

  return new Promise(resolve => {
    resolve(token);
  });
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

      return client;
    })
    .then(async client => {
      const token = await fetchToken(client);
      console.log('fetch access token', token);

      const demoUser = {
        username: 'viewer-demo-user',
        firstName: 'demo',
        lastName: 'demo',
        email: 'demouser@xyz.com',
        enabled: true,
        credentials: [{
          type: 'password',
          value: 'demo'
        }]
      }

      console.log('check if demo user exists in KeyCloak');
      const userId = await searchUser(demoUser.username, token);
      if (userId !== '') {
        console.log('demo user already existed, try delete user from KeyCloak');
        const success = await deleteUser(userId, token);
        console.log('delete demo user successfully', success);
      }
      createUser(demoUser, token).then(success => console.log('create demo user successfully', success));
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
      // TODO: for some reason this not work within the app but works fine from Postman and stand-alone script (see script-fetch.js)
      console.log('try retrieve user token via https (ssl/tls)');

      // credentials with client certificate
      const CREDENTIALS = {
        "certificate": "-----BEGIN CERTIFICATE-----\nMIIFlzCCA3+gAwIBAgIUQAMAAAGFgWEq+AAAAYWETAxzAAAwDQYJKoZIhvcNAQEL\nBQAwejELMAkGA1UEBhMCREUxEDAOBgNVBAcMB2NmLXVzMTAxDzANBgNVBAoMBlNB\nUCBTRTEYMBYGA1UECwwPU0FQIEJUUCBDbGllbnRzMS4wLAYDVQQDDCVTQVAgUEtJ\nIENlcnRpZmljYXRlIFNlcnZpY2UgQ2xpZW50IENBMB4XDTIzMDEwNTIyMzczNFoX\nDTIzMDExMjIzMzczNFowgbMxCzAJBgNVBAYTAkRFMQ8wDQYDVQQKEwZTQVAgU0Ux\nIzAhBgNVBAsTGlNBUCBDbG91ZCBQbGF0Zm9ybSBDbGllbnRzMS0wKwYDVQQLEyRk\nNjQ4MjQ5ZC02YjMxLTQxOTAtYjZjYy04MDAzNGQwMjA4MmExEDAOBgNVBAcTB3Nh\ncC11YWExLTArBgNVBAMTJDVjYmI1YmM4LWZlNjItNGE1Zi05MThhLTM5ZmY0MGE3\nZTI3NTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMslNmyAy8gU0Lr3\nz6yDGq1FhJkQHatRb+rJzg+JKbtu118BZem+FfL6uLBR37WpyWr7w9XF1Nf8E1TM\n/l1N9aqohdPQtld+EzCMc3wWCT9MKx+MYpWt/VqA+tAFTtc3kfTojnIxmzcBjBVU\nftWQUn7Ec8zGUDizNbHEQuXwmnzSO220sDsJ+I1ydX5wkM21G3gQwaxRlx6xOL+U\nH+kwm/bpLitP190gUhyyT0v1a1v/GaaidpfhtjDGgob0g1BHixFyY3FNDhiYq9By\nghHxKg/NvnYF7lgslUip6c99E0FbnAe4p4793x91xu6bFX0PQ+2MxfL6qBt25zOI\nTc6H/98CAwEAAaOB2jCB1zAJBgNVHRMEAjAAMA4GA1UdDwEB/wQEAwIFoDATBgNV\nHSUEDDAKBggrBgEFBQcDAjAdBgNVHQ4EFgQUyCXt6fWhgTst/KuNzPUUvaacVSQw\nHwYDVR0jBBgwFoAU/GIMbwL+hYtjxIP9u1seRuNPPzwwZQYDVR0fBF4wXDBaoFig\nVoZUaHR0cHM6Ly9jZXJ0aWZpY2F0ZS1zZXJ2aWNlLWNybHMuY2YudXMxMC5oYW5h\nLm9uZGVtYW5kLmNvbS8xNjcyODIxNzA3XzE2NzgyNjg1MDcuY3JsMA0GCSqGSIb3\nDQEBCwUAA4ICAQCMX8XwLQwJm16rRj1qd+BdLnbz2msUKB4ua4XKmfmstLTW0LF0\nfF3fjVyIMaZnp0Imja0iRDKKb566oTGoxLo8RS1wPnaSDi4WZmO7uhoSoOqLKI3t\nKPBNgT0frE4jCqbLG97rUxNmuY8WEgAEJk2FF4ekc+LCkYXdWHf0MvUoo4PKYKyQ\nYcf3RuUkxKD/xf2zLBGdKNDkXqF4/uyYV7zcQJt6Vvoj68H0tLbq++h8LgIiZLJo\n8PjeX9x1tmsxRdnj/uZE1HcsjHcuKoBIFYRiP8Af68iLVW9Ipxvm6fQXS17Elu7K\nCQV/L65a9UfdXgGLA9Sx0FjNfuhcvaTREXD3ErL+7u7vOqUgG5bKt88HxlIwh53Z\nCJd/W37JAMbCTGeTwJv8DB5hlsehrP0iXEwzHH8HhAOPR2zYzrEgn7BN01Krbzd0\nPbdzchU9lFePxIKMLvjCG8hx6eMUuBMFAHa/DK9QYTToHZNCCrDM4YfnaqsxOv9l\nRYdQ60MLtzd4J7Yv97ZIpt3oAbNdGS0gEdBDQHWpfnms+eFDjLxjbyohVT+guf1g\nyUHgPQ39RBdqAXBPB/9JwxzjVtj+N+xyDkwjFOJ+KZzMNbYJKtP/mJTbdAMbwHpg\n62PFVBC2incTLqNLbiUZNzdMq5mmhireJcIQ1mtJ8EzZbDKz65C4t4jcRw==\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\n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\npxozuO3wpMMT\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\n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\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nMIIFZjCCA06gAwIBAgIQGHcPvmUGa79M6pM42bGFYjANBgkqhkiG9w0BAQsFADBN\nMQswCQYDVQQGEwJERTERMA8GA1UEBwwIV2FsbGRvcmYxDzANBgNVBAoMBlNBUCBT\nRTEaMBgGA1UEAwwRU0FQIENsb3VkIFJvb3QgQ0EwHhcNMTkwMjEzMTExOTM2WhcN\nMzkwMjEzMTEyNjMyWjBNMQswCQYDVQQGEwJERTERMA8GA1UEBwwIV2FsbGRvcmYx\nDzANBgNVBAoMBlNBUCBTRTEaMBgGA1UEAwwRU0FQIENsb3VkIFJvb3QgQ0EwggIi\nMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQChbHLXJoe/zFag6fB3IcN3d3HT\nY14nSkEZIuUzYs7B96GFxQi0T/2s971JFiLfB4KaCG+UcG3dLXf1H/wewq8ahArh\nFTsu4UR71ePUQiYlk/G68EFSy2zWYAJliXJS5k0DFMIWHD1lbSjCF3gPVJSUKf+v\nHmWD5e9vcuiPBlSCaEnSeimYRhg0ITmi3RJ4Wu7H0Xp7tDd5z4HUKuyi9XRinfvG\nkPALiBaX01QRC51cixmo0rhVe7qsNh7WDnLNBZeA0kkxNhLKDl8J6fQHKDdDEzmZ\nKhK5KxL5p5YIZWZ8eEdNRoYRMXR0PxmHvRanzRvSVlXSbfqxaKlORfJJ1ah1bRNt\no0ngAQchTghsrRuf3Qh/2Kn29IuBy4bjKR9CdNLxGrClvX/q26rUUlz6A3lbXbwJ\nEHSRnendRfEiia+xfZD+NG2oZW0IdTXSqkCbnBnign+uxGH5ECjuLEtvtUx6i9Ae\nxAvK2FqIuud+AchqiZBKzmQAhUjKUoACzNP2Bx2zgJOeB0BqGvf6aldG0n2hYxJF\n8Xssc8TBlwvAqtiubP/UxJJPs+IHqU+zjm7KdP6dM2sbE+J9O3n8DzOP0SDyEmWU\nUCwnmoPOQlq1z6fH9ghcp9bDdbh6adXM8I+SUYUcfvupOzBU7rWHxDCXld/24tpI\nFA7FRzHwKXqMSjwtBQIDAQABo0IwQDAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/\nBAUwAwEB/zAdBgNVHQ4EFgQUHLxmKw7KjUufjZNxqQ/KZ0ZpEyIwDQYJKoZIhvcN\nAQELBQADggIBABdSKQsh3EfVoqplSIx6X43y2Pp+kHZLtEsRWMzgO5LhYy2/Fvel\neRBw/XEiB5iKuEGhxHz/Gqe0gZixw3SsHB1Q464EbGT4tPQ2UiMhiiDho9hVe6tX\nqX1FhrhycAD1xHIxMxQP/buX9s9arFZauZrpw/Jj4tGp7aEj4hypWpO9tzjdBthy\n5vXSviU8L2HyiQpVND/Rp+dNJmVYTiFLuULRY28QbikgFO2xp9s4RNkDBnbDeTrT\nCKWcVsmlZLPJJQZm0n2p8CvoeAsKzIULT9YSbEEBwmeqRlmbUaoT/rUGoobSFcrP\njrBg66y5hA2w7S3tDH0GjMpRu16b2u0hYQocUDuMlyhrkhsO+Qtqkz1ubwHCJ8PA\nRJw6zYl9VeBtgI5F69AEJdkAgYfvPw5DJipgVuQDSv7ezi6ZcI75939ENGjSyLVy\n4SuP99G7DuItG008T8AYFUHAM2h/yskVyvoZ8+gZx54TC9aY9gPIKyX++4bHv5BC\nqbEdU46N05R+AIBW2KvWozQkjhSQCbzcp6DHXLoZINI6y0WOImzXrvLUSIm4CBaj\n6MTXInIkmitdURnmpxTxLva5Kbng/u20u5ylIQKqpcD8HWX97lLVbmbnPkbpKxo+\nLvHPhNDM3rMsLu06agF4JTbO8ANYtWQTx0PVrZKJu+8fcIaUp7MVBIVZ\n-----END CERTIFICATE-----\n",
        "certurl": "https://c152bee4trial.authentication.cert.us10.hana.ondemand.com",
        "clientid": "sb-clicertxsappname!t128042",
        "key": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAyyU2bIDLyBTQuvfPrIMarUWEmRAdq1Fv6snOD4kpu27XXwFl\n6b4V8vq4sFHftanJavvD1cXU1/wTVMz+XU31qqiF09C2V34TMIxzfBYJP0wrH4xi\nla39WoD60AVO1zeR9OiOcjGbNwGMFVR+1ZBSfsRzzMZQOLM1scRC5fCafNI7bbSw\nOwn4jXJ1fnCQzbUbeBDBrFGXHrE4v5Qf6TCb9ukuK0/X3SBSHLJPS/VrW/8ZpqJ2\nl+G2MMaChvSDUEeLEXJjcU0OGJir0HKCEfEqD82+dgXuWCyVSKnpz30TQVucB7in\njv3fH3XG7psVfQ9D7YzF8vqoG3bnM4hNzof/3wIDAQABAoIBAAs2LY/Fd/m99Fst\nTB/oSHOhr5THB+wpnXSm2KGQ32XB008iA57n58w2PDU2/5LGISCvbnqA5aNZ/TMj\n8THzGIjnriMnlLi1c5etWL5TdQUyTfr6w4IhTSdOkQkkEdrc7UhIAXyZ8kgR5MpU\nlH9y7KqkawO1Oj423dLG0y5fnhcfZgtUHb39ZrW69BlL33G26h1OxwEOILyNWWRV\nFH2c4lAaeeMWOaUWwzW7bzz7Brob6/deI0GFkcJwnk/FDVsCefPO6a+bXrXnZgr7\noYj0LJ8JpGZQghWEjwRxRUXwffxdsngkrH1hjYvG+JfuyxkARrxJpKzNyzeEp/VN\niXTujzECgYEA6uo/gmKQWztw9SUR/oJCity3gyKOgPAqCl95kksAQPLST3VkFz+k\nFMZbdolz7/Z+id1GBF/rmzgwOEH+17ImPA+4dWLWQO+UtfT0a7ACrC8nqWmjR4zN\nQhhpBvac+K/yzHfPB7ZgW+WXjh/i8Ugz2WGmILbsNLwf+euuRgo41gkCgYEA3WD6\nYE1RSv9cvq+T4oOedWmrv4FmqrG+CYXvmqmg00RMhP8YpNkxMeg8TrcpqylLwbwM\nNjlRh3iqnuQccn8SKkDeanILDnfITJpUgTbZXAf7aH9VY1ebTk4Ht/EG5RIar0yX\n+U3junq73m6lzt01donkdDmwCGgN2fYj3h3pYKcCgYAUKLX6gmrQ6XDwGJZKuPLs\n57P31OdVuUZiTX8pRrZm3G+f0fsc46E5ByyiJ3mDhiuluQ9hILofP9sjeMZdzDPr\nw42YxTqNqAGi+7pd42TXUdSdfSs94J9cpKuepVsjHDZBxaZGiygJutIeqC3ZdtC8\nPtz6wbfTbrFvyQHTkNz/wQKBgAyiKCeuweDhyc0n/+yBTl2s9hwrqkw7cHjip9XP\nsFneH+/HDwT5UBFlC2wCj+IwrR4VOS0vADQW8sW2htkR31uB8C9q6q6cr1WPyRrG\noojZ+8Lu4VSV/0rssQwSOS6BZfxzBok3pLNTpbz/235+qTpmjB8F28HfDktN/KYE\nVvkpAoGBANux0oMzXT+zInRGQNh1XjI3qkICI3wF3oq1T52UlQScnPsVUCoEyWON\nb3+ppiuq/1pQExVK+Q1YIFqiy25XbVqEIIqTQBYTha5R2MkbVonT6nmkN4/5FWuD\nf7lVxs/Jnnsm4SgNTvDL3yrEL7QjrTOxQknw5zsZL+JDH96eE7bZ\n-----END RSA PRIVATE KEY-----\n"
      }

      // configure request
      console.log('configure request');
      const url = CREDENTIALS.certurl + '/oauth/token'
      const params = new URLSearchParams()
      params.append('grant_type', 'client_credentials')
      params.append('response_type', 'token')
      params.append('client_id', CREDENTIALS.clientid)

      console.log('configure options');
      const options = {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        agent : new https.Agent({
          key: CREDENTIALS.key,
          cert: CREDENTIALS.certificate
        })
      }

      // execute request
      console.log('execute request');
      /*
      fetch(url, options)
      .then(response => response.json())
      .then(json => console.log('response', json));
      */
    })
    .then(() => {
      ReactDOM.render(<App />, rootElement);
    });
};

smartLaunch();
