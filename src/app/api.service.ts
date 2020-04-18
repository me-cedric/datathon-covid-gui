import { Injectable } from '@angular/core'
import {
  HttpClient,
  HttpEvent,
  HttpErrorResponse,
  HttpEventType,
  HttpHeaders
} from '@angular/common/http'
import { map } from 'rxjs/operators'

import { environment as env } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  SERVER_URL = env.serverUrl || 'https://file.io/'
  UPLOAD_URL = env.uploadUrl || ''
  SEGMENTATION_URL = env.segmentationUrl || ''
  CLASSIFICATION_URL = env.classificationUrl || ''

  constructor(private httpClient: HttpClient) {}

  public upload(formData: FormData) {
    return this.httpClient.post<any>(this.SERVER_URL, formData, {
      reportProgress: true,
      observe: 'events'
    })
  }

  public triggerModel(
    formData: FormData,
    checkType: 'segmentation' | 'classification'
  ) {
    const uri =
      this.SERVER_URL +
      (checkType === 'segmentation'
        ? this.SEGMENTATION_URL
        : this.CLASSIFICATION_URL)
    return this.httpClient.post<any>(uri, formData, {
      reportProgress: true,
      observe: 'events'
    })
  }
}
