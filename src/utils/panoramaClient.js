const baseURL = 'http://ephs55.panoramacld.com/SDSM/API';

// request headers specific for Panorama
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept-Language': 'en'
};

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
  .then(response => response.json());
}

function getPatient(user, role, id) {
  let url = baseURL + '/Client/Client/' + id;
  let headers = Object.assign(defaultHeaders, {
    'panorama_organization_user_role': role,
    'panorama_user': user
  })

  return get(url, headers).then(data => data.client);
}

function getPatientVaccination(user, role, id) {
  let url = baseURL + '/Immunization/Profile';
  let client = { id: id };
  let data = { client: client };
  let headers = Object.assign(defaultHeaders, {
    'panorama_organization_user_role': role,
    'panorama_user': user
  })

  return post(url, data, headers).then(data => data.profile.immunizations);
}

function getUserRoles(user) {
  let url = baseURL + '/Security/ApplicationUserLight';
  let headers = Object.assign(defaultHeaders, {
    'Accept-Language': 'en',
    'panorama_user': user
  });

  return get(url, headers).then(data => data.applicationUser.organizationUserRoles);
}

export { getPatient, getPatientVaccination, getUserRoles }