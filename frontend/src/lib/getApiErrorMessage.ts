import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return error.message || "Unable to reach the server. Check the deployed backend and API URL configuration.";
    }

    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
