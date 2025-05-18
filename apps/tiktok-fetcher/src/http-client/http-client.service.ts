import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpClientService {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await axios.get<T>(url, config);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Request failed'
                );
            }
            throw error;
        }
    }
}
