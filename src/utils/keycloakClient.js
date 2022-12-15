const baseURL = 'http://localhost:8080/realms/cambianpanoramaviewer/protocol/openid-connect';

// KeyCloak client related - should represent Cambian
const clientId = 'viewer';
const clientSecret = 'IVibu4pEBBVbvoqpJvqHidPYe7xNkvsw';

// request headers specific for KeyCloak
const headers = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  'Origin': 'http://localhost:3000/'
};

async function post(url = '', data = {}) {
  let body = new URLSearchParams(data);
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: body
  })
  .then(response => response.json());
}

function getToken(username, password) {
  let url = baseURL + '/token';
  let data = {
    'client_id': clientId,
    'client_secret': clientSecret,
    'grant_type': 'password',
    'username': username,
    'password': password
  }

  return post(url, data).then(data => data.access_token);
}

function validateToken(token) {
  let url = baseURL + '/token/introspect';
  let data = {
    'token': token,
    'client_id': clientId,
    'client_secret': clientSecret
  }

  return post(url, data).then(data => data.active);
}

export { getToken, validateToken }

