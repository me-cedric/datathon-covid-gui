import { Injectable } from '@angular/core'
import {
  HttpClient,
  HttpEvent,
  HttpErrorResponse,
  HttpEventType
} from '@angular/common/http'
import { map } from 'rxjs/operators'

import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  SERVER_URL = environment.serverUrl || 'https://file.io/'

  constructor(private httpClient: HttpClient) {}

  public upload(formData: FormData) {
    return this.httpClient.post<any>(this.SERVER_URL, formData, {
      reportProgress: true,
      observe: 'events'
    })
  }
}
