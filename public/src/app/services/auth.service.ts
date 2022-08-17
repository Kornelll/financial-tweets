import { Injectable } from '@angular/core';
import { throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material';
import { catchError, publishReplay, refCount, map } from 'rxjs/operators';
import { CacheHandler } from '@/scripts';
import { AppSettings } from '@/settings';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    public baseUrl = '';
    public token: String = '';
    public headers: any;

    constructor(private http: HttpClient,
        public router: Router,
        public toastr: ToastrService,
        private dialogRef: MatDialog
    ) {
        this.token = CacheHandler.getStoredToken();
        // this.baseUrl = AppSettings.API_ENDPOINT;
    }

    isLoggedIn() {
        let token = CacheHandler.getStoredToken();
        // console.log("token", token)
        return !!token;
    }

    cacheMap = {};

    get(url, options?): Observable<any> {
        try {
            if (url[url.length - 1] == '&') {
                url = url.substr(0, url.length - 1);
            }
        } catch (err) { }

        if (options && options.fromCache) {
            if (this.cacheMap[url]) {
                return <any>this.cacheMap[url];
            }
        }

        let pipe = this.http.get(url, { headers: this.jwt(options) })
            .pipe(
                catchError((error: HttpErrorResponse) => this.handleError(error, url, options)),
                publishReplay(1),
                refCount()
            );
        if (options && options.fromCache) {
            this.cacheMap[url] = pipe;
        }
        return pipe;
    }

    post(url: string, body: any, options?) {
        try {
            if (url[url.length - 1] == '&') {
                url = url.substr(0, url.length - 1);
            }
        } catch (err) { }

        return this.http.post(url, body, { headers: this.jwt(options) })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, url)));
    }

    put(url: string, body: any) {
        try {
            if (url[url.length - 1] == '&') {
                url = url.substr(0, url.length - 1);
            }
        } catch (err) { }

        return this.http.put(url, body, { headers: this.jwt() })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, url)));
    }

    patch(url: string, body: any) {
        try {
            if (url[url.length - 1] == '&') {
                url = url.substr(0, url.length - 1);
            }
        } catch (err) { }

        return this.http.patch(url, body, { headers: this.jwt() })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, url)));
    }

    delete(url: string, options?: { ignoreToast?: boolean, ignoreLogout?: boolean }) {
        try {
            if (url[url.length - 1] == '&') {
                url = url.substr(0, url.length - 1);
            }
        } catch (err) { }

        return this.http.delete(url, { headers: this.jwt(options) })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, url, options)));
    }

    deleteBulk(url: string, body: any) {
        try {
            if (url[url.length - 1] == '&') {
                url = url.substr(0, url.length - 1);
            }
        } catch (err) { }

        return this.http.request('DELETE', url, { headers: this.jwt(), body: body })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, url)));
    }
    public jwt(options?) {
        this.token = CacheHandler.getStoredToken();
        if (!this.token) {
            if (!options || !options.ignoreLogout) {
                localStorage.setItem("rAlogin", this.router.url);
                this.logOut();
            }
            return null;
        } else {
            this.token = CacheHandler.getStoredToken();
            this.headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'apikey': '' + this.token
            });
            return this.headers;
        }
    }
    handleError(err, url, options?) {

        if (err.status == 401 || err.status == 402) {

            if (!options || !options.ignoreToast) {
                this.toastr.clear();
                this.toastr.error(
                    err && err.error && err.error.message ? err.error.message : err.statusText,
                    "Session Failed / Timed Out",
                    { timeOut: 0 }
                );
            }
            // localStorage.setItem("rAlogin", this.router.url);
            this.logOut(err, url);
        } else if (err.status == 0) {
            if (!options || !options.ignoreToast) {
                this.toastr.info(
                    "Something went wrong!",
                    "Please try again later",
                    { timeOut: 3000 }
                );
            }
        } else if (err.status == 403) {
            if (!options || !options.ignoreToast) {
                this.toastr.clear();
                this.toastr.error(
                    err.error.message,
                    "Permission Denied",
                    { disableTimeOut: true }
                );
            }
        } else if (err.status == 429) {
            if (!options || !options.ignoreToast) {
                this.toastr.clear();
                this.toastr.warning(
                    err.error.message,
                    err.error.message2 || `Please try again later!`,
                    { disableTimeOut: true }
                );
            }
        }

        return throwError(err);

    }
    logOut(err?, url?) {
        localStorage.removeItem('___d');
        localStorage.removeItem('___notification_subscription');
        Cookie.deleteAll();
        this.dialogRef.closeAll();
        this.delete(`${AppSettings.API_ENDPOINT}/login`, { ignoreToast: true, ignoreLogout: true }).subscribe();
        this.router.navigate(['/login']);
    }

}
