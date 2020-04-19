import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { environment as env } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  SERVER_URL = env.serverUrl || 'https://file.io/'
  UPLOAD_URL = env.uploadUrl || ''
  SEGMENTATION_URL = env.segmentationUrl || ''
  CLASSIFICATION_URL = env.classificationUrl || ''
  headersObject: HttpHeaders = new HttpHeaders({
    Authorization: `Basic ${btoa(env.apiBasicAuth)}`
  })

  constructor(private httpClient: HttpClient) {}

  public upload(formData: FormData) {
    return this.httpClient.post<any>(
      this.SERVER_URL + this.UPLOAD_URL,
      formData,
      {
        reportProgress: true,
        observe: 'events',
        headers: this.headersObject
      }
    )
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
      observe: 'events',
      headers: this.headersObject
    })
  }
}
