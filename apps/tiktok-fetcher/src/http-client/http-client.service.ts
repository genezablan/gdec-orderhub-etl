import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpClientService {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await axios.get<T>(url, config);
            return response.data;
        } catch (error) {
            console.log('Error in HttpClientService.get:', error);
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Request failed'
                );
            }
            throw error;
        }
    }

    async post<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<T> {
        try {
            const response = await axios.post<T>(url, data, config);
            return response.data;
        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                axios.isAxiosError(error)
            ) {
                const errData = error.response?.data as
                    | { message?: string }
                    | undefined;
                const errMsg = errData?.message;
                throw new Error(errMsg || 'Request failed');
            }
            throw error;
        }
    }
}
