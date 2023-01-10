const baseURL = 'http://localhost:8080/admin/realms/cambianpanoramaviewer/users';

function requestHeader(token) {
  const headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };

  return headers;
}

async function get(url = '', headers = {}) {
  return fetch(url, {
    method: 'GET',
    headers: headers
  })
  .then(response => response.json());
}

async function post(url = '', data = {}, headers = {}) {
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      return false;
    }
    return true;
  });
}

async function deleteReq(url = '', headers = {}) {
  return fetch(url, {
    method: 'DELETE',
    headers: headers
  })
  .then(response => {
    if (!response.ok) {
      return false;
    }
    return true;
  });
}

/* search KeyCloak user by user name, return id if exist, empty string otherwise */
function searchUser(username, token) {
  let url = baseURL + '?username=' + username + '&exact=true';
  let headers = requestHeader(token);

  return get(url, headers)
  .then(data => {
    if (data.length === 1) {
      return data[0].id
    }
    return '';
  });
}

function deleteUser(userId, token) {
  let url = baseURL + '/' + userId;
  let headers = requestHeader(token);

  return deleteReq(url, headers);
}

function createUser(user, token) {
  let url = baseURL;
  let headers = requestHeader(token);

  return post(url, user, headers);
}

export { searchUser, createUser, deleteUser }

