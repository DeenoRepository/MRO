import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly apiBaseUrl = '/api/v1';
  private readonly devAuthHeaders = new HttpHeaders({
    Authorization: 'Basic ' + btoa('admin:admin')
  });

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string): Observable<ApiSuccessResponse<T>> {
    return this.http.get<ApiSuccessResponse<T>>(`${this.apiBaseUrl}${path}`, { headers: this.devAuthHeaders });
  }

  post<TRequest, TResponse>(path: string, body: TRequest): Observable<ApiSuccessResponse<TResponse>> {
    return this.http.post<ApiSuccessResponse<TResponse>>(`${this.apiBaseUrl}${path}`, body, { headers: this.devAuthHeaders });
  }

  put<TRequest, TResponse>(path: string, body: TRequest): Observable<ApiSuccessResponse<TResponse>> {
    return this.http.put<ApiSuccessResponse<TResponse>>(`${this.apiBaseUrl}${path}`, body, { headers: this.devAuthHeaders });
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}${path}`, { headers: this.devAuthHeaders });
  }
}
