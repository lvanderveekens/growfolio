import axios from 'axios';

export const api = axios.create({
  baseURL: "/api",
});
 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      // const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login`;
    }
    return Promise.reject(error);
  }
);