import axios from "axios";

const api = axios.create({
  baseURL : "http://localhost:8000"
});

api.interceptors.request.use((config) => {
  console.log("AXIOS REQUEST:", config.method?.toUpperCase(), config.baseURL, config.url);
  return config;
});
api.interceptors.response.use((res) => {
  console.log("AXIOS RESPONSE URL:", res.config.baseURL, res.config.url);
  return res;
});


export default api;