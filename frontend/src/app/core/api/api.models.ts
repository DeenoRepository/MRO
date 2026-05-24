export interface ApiMeta {
  requestId?: string | null;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiMeta;
  errors: unknown[];
}

