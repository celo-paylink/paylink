import axiosInstance from "./api"

export const PaylinkService = {
  createLink: async (payload: { [key: string]: string | number | Date | null }) => {
    const response = await axiosInstance.post('/paylink/create', payload);
    return response 
  },
  getClaim: async (claimCode: string) => {
    const response = await axiosInstance.get(`/paylink/claim/${claimCode}`);
    return response 
  },
  confirmClaim: async (payload: { [key: string]: string | number | Date | null }) => {
    const response = await axiosInstance.put("/paylink/claim/confirm", payload);
    return response 
  },
  reclaimClaim: async (payload: { [key: string]: string | number | Date | null }) => {
    const response = await axiosInstance.put("/paylink/reclaim/confirm", payload);
    return response 
  }
}