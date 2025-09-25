import axiosInstance from "./api"

export const UserService = {
  signOrLogin: async (payload: { [key: string]: string | number }) => {
    const response = await axiosInstance.post('/auth/siwe/nonce', payload);
    return response 
  },
  verifySignature: async (payload: { [key: string]: string | number }) => {
    const response = await axiosInstance.post('/auth/siwe/verify', payload);
    return response 
  }
}