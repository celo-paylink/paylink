import axios from "axios";
import { disconnect } from '@wagmi/core'
import { config } from "@/libs/config";

const baseURL = 'https://paylink-backend-9ks2.onrender.com/api';

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


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized - redirecting to login');
          disconnect(config);
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error - please try again later');
          break;
        default:
          console.error('An error occurred:', error.response.data.message);
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;