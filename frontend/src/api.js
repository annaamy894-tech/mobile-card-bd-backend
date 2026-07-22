import axios from "axios";

const baseURL = import.meta.env.PROD
  ? "https://mobile-card-bd.onrender.com/api"
  : "/api";

const api = axios.create({ baseURL, withCredentials: false });

export default api;