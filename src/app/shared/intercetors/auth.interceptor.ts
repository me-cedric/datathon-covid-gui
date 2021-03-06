import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http'
import { Injectable } from '@angular/core'

import { Observable } from 'rxjs'
import { environment as env } from '../../../environments/environment'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    req = req.clone({
      setHeaders: {
        Authorization: `Basic ${btoa(env.apiBasicAuth)}`
      }
    })

    return next.handle(req)
  }
}
