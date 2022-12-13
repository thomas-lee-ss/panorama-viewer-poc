const baseURL = 'http://ephs55.panoramacld.com/SDSM/API';

// request headers specific for Panorama
const headers = {
  'Content-Type': 'application/json',
  'Accept-Language': 'en',
  'panorama_organization_user_role': 1,
  'panorama_user': 'PERMISSIONS'
};

async function get(url = '') {
  return fetch(url, {
    method: 'GET',
    headers: headers
  })
  .then(response => response.json());
}

async function post(url = '', data = {}) {
  return fetch(url, {
    method: 'POST',
    headers: headers,
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

export { getPatient, getPatientVaccination }