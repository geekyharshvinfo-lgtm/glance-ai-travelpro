// API Response wrapper
export interface ApiResponse<T> {
  status: number;
  data: T;
}
