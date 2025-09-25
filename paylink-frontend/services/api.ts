import axios from "axios";

const baseURL = 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL, 
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('paylink_auth_token');  
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;