import { useState, useCallback } from "react";
import { api } from "./use-api";
import { AxiosRequestConfig, AxiosResponse } from "axios";

interface ErrorResponse {
  message?: string;
}

interface RequestError extends Error {
  response?: {
    data?: ErrorResponse;
  };
}

export function useRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (config: AxiosRequestConfig): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AxiosResponse = await api(config);
      return response.data;
    } catch (err: unknown) {
      const error = err as RequestError;
      const errorMessage = error.response?.data?.message || error.message || "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
}