import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly apiBaseUrl = '/api/v1';

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string): Observable<ApiSuccessResponse<T>> {
    return this.http.get<ApiSuccessResponse<T>>(`${this.apiBaseUrl}${path}`);
  }

  post<TRequest, TResponse>(path: string, body: TRequest): Observable<ApiSuccessResponse<TResponse>> {
    return this.http.post<ApiSuccessResponse<TResponse>>(`${this.apiBaseUrl}${path}`, body);
  }

  put<TRequest, TResponse>(path: string, body: TRequest): Observable<ApiSuccessResponse<TResponse>> {
    return this.http.put<ApiSuccessResponse<TResponse>>(`${this.apiBaseUrl}${path}`, body);
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}${path}`);
  }
}

