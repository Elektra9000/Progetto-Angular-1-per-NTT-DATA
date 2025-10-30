import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const token = sessionStorage.getItem('gorest_token') || '';
  const cloned = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    : req;

  return next(cloned).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
        sessionStorage.removeItem('gorest_token');
      }
      return throwError(() => err);
    })
  );
};
