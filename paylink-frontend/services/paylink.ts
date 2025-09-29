import axiosInstance from "./api"

export const PaylinkService = {
  createLink: async (payload: { [key: string]: string | number | Date | null }) => {
    const response = await axiosInstance.post('/paylink/create', payload);
    return response 
  }
}