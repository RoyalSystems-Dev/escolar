import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MailStatus {
  enabled: boolean;
  configured: boolean;
  mode: 'smtp' | 'ethereal' | 'off';
  host: string;
  port: number;
  user: string;
  from: string;
  fromName: string;
  replyTo: string;
  testTo: string;
  hasPassword: boolean;
  devFallback: string;
}

export interface MailVerifyResult {
  ok: boolean;
  message: string;
  mode: string;
}

export interface MailTestResult {
  sent: boolean;
  simulated: boolean;
  messageId?: string;
  previewUrl?: string;
  mode?: string;
  verify: MailVerifyResult;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class MailApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mail`;

  getStatus(): Observable<MailStatus> {
    return this.http.get<MailStatus>(`${this.base}/status`);
  }

  verify(): Observable<MailVerifyResult> {
    return this.http.get<MailVerifyResult>(`${this.base}/verify`);
  }

  sendTest(to?: string): Observable<MailTestResult> {
    return this.http.post<MailTestResult>(`${this.base}/test`, to ? { to } : {});
  }
}
