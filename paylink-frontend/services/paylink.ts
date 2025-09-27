import axiosInstance from "./api"

export const PaylinkService = {
  createLink: async (payload: { [key: string]: string | number }) => {
    const response = await axiosInstance.post('/paylink/create', payload);
    return response 
  },
  getLink: async () => {
    const response = await axiosInstance.get('/paylink/create');
    return response 
  }
}