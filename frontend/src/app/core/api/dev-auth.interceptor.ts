import { HttpInterceptorFn } from '@angular/common/http';

const DEV_BASIC_AUTH = 'Basic ' + btoa('admin:admin');

export const devAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authorized = req.clone({
    setHeaders: {
      Authorization: DEV_BASIC_AUTH
    }
  });
  return next(authorized);
};

