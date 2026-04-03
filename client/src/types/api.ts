export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string>;
}
