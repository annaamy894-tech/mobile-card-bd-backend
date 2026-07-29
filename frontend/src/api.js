import axios from "axios";

const baseURL = "https://mobile-card-bd-backend.onrender.com/api";

const api = axios.create({ baseURL, withCredentials: true });

export default api;