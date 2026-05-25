import { HttpInterceptorFn } from '@angular/common/http';

const DEV_BASIC_AUTH = 'Basic ' + btoa('admin:admin');

export const devAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Apply dev credentials to local API calls to keep backend Basic Auth transparent in UI.
  const isApiCall = req.url.startsWith('/api/');
  if (!isApiCall) {
    return next(req);
  }

  const authorized = req.clone({
    setHeaders: {
      Authorization: DEV_BASIC_AUTH
    }
  });
  return next(authorized);
};
