import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from './api.config';

export const sanctumInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_URL)) {
    return next(request);
  }

  const xsrfToken = readCookie('XSRF-TOKEN');
  const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);

  return next(
    request.clone({
      withCredentials: true,
      ...(isUnsafeMethod && xsrfToken
        ? { setHeaders: { 'X-XSRF-TOKEN': xsrfToken } }
        : {}),
    }),
  );
};

function readCookie(name: string): string | null {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}
