let apiRoot = ''
if (process.env.BUILD_MODE === 'dev') {
  apiRoot = 'http://localhost:1302'
}

if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://trello-backend-cnqy.onrender.com'
}
// export const API_ROOT = 'http://localhost:1302'
export const API_ROOT = apiRoot
