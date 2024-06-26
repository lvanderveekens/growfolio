import axios from 'axios';

export const api = axios.create({
  baseURL: "/api",
});
 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      window.location.href = `/`;
    }
    return Promise.reject(error);
  }
);