const baseURL = 'http://ephs55.panoramacld.com/SDSM/API';

// request headers specific for Panorama
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept-Language': 'en',
  'panorama_organization_user_role': 1,
  'panorama_user': 'PERMISSIONS'
};

async function get(url = '', headers = defaultHeaders) {
  return fetch(url, {
    method: 'GET',
    headers: headers
  })
  .then(response => response.json());
}

async function post(url = '', data = {}) {
  return fetch(url, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(data)
  })
  .then(response => response.json());
}

function getPatient(id) {
  let url = baseURL + '/Client/Client/' + id;
  return get(url).then(data => data.client);
}

function getPatientVaccination(id) {
  let url = baseURL + '/Immunization/Profile';
  let client = { id: id };
  let data = { client: client };
  return post(url, data).then(data => data.profile.immunizations);
}

function getUserRoles(user) {
  let url = baseURL + '/Security/ApplicationUserLight';
  let headers = {
    'Accept-Language': 'en',
    'panorama_user': user
  };
  return get(url, headers).then(data => data.applicationUser.organizationUserRoles);
}

export { getPatient, getPatientVaccination, getUserRoles }