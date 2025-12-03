import axios from "axios";



const AxiosInstance = axios.create({
    baseURL:import.meta.env.VITE_BACKEND_ENDPOINT,
    withCredentials:true
})


export { AxiosInstance as Axioss}