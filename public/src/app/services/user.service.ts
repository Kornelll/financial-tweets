import { Injectable, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { AppSettings } from '@/settings';
import { Encrytojs, CacheHandler } from '@/scripts';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserModel, UserConfigurationModel } from '../modules/users-module/models';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { AclService } from './acl.service';
import { RoleModel, ProjectRoleModel } from '../modules/configurations-module/models';


@Injectable({
    providedIn: 'root'
})
export class UserService {

    user: UserModel;
    private userUpdatedSubject = new Subject<UserModel>();

    public URL = `${AppSettings.API_ENDPOINT}/users`;
    public updatePasswordUrl = 'account/users/password';

    constructor(
        public http: HttpClient,
        private authSvc: AuthService,
        private toastr: ToastrService,
        private aclSvc: AclService
    ) {
        this.user = CacheHandler.getStoredUser();
    }

    getUserUpdatedSubject(): Subject<UserModel> {
        //it will emit updated current logged user when logged in user is updated
        return this.userUpdatedSubject;
    }

    login(model) {
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/login`, model, { ignoreLogout: true }).pipe(map((res: { user: any, token: string }) => {
            CacheHandler.storeLoginData(res);
            this.user = res.user;
            return res;
        }));
    }
    logout() {
        try { var subscription = JSON.parse(localStorage.getItem('___notification_subscription')); } catch (err) { }
        try { subscription.unsubscribe() } catch (err) { }
        CacheHandler.removeLoginData();
        this.http.put(`${AppSettings.API_ENDPOINT}/login/${this.user._id}`, { notificationSubscription: subscription }).subscribe();
        localStorage.removeItem('___notification_subscription');
        this.user = null;
        return of({});
    }
    register(model) {
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/login/register`, model, { ignoreLogout: true })
    }

    activateAccount(model) {
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/login/activate-account`, model, { ignoreLogout: true }).pipe(map((res: { user: any, token: string }) => {
            CacheHandler.storeLoginData(res);
            this.user = res.user;
            return res;
        }));
    }

    forgotPassword(model) {
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/login/forgot-password`, model, { ignoreLogout: true })
    }

    resendActivationCode(model: { email: string, recapcha?: string }) {
        model['timestamp'] = new Date().getTime();
        let plain = JSON.stringify(model);
        let payload = <any>{ data: Encrytojs.encrypt(plain).toString() };
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/login/resend-code`, payload, { ignoreLogout: true })
    }
    resetPassowrd(model) {
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/login/reset-password`, model, { ignoreLogout: true })
    }
    saveUser(model) {
        return this.authSvc.post(`${this.URL}`, model)
    }
    updateUser(model) {
        return this.authSvc.put(`${this.URL}/${model._id}`, model).pipe(map(res => {
            if (this.user.avatarSrc) {
                this.user.avatarSrc = `${this.user.avatarSrc}?timestamp=${Date.now()}`
            }
            return res;
        }))
    }
    removeUser(model) {
        return of([]);
    }
    getUsers(url): Observable<any> {
        return this.authSvc.get(url)
    }
    getAllUsers(): Observable<any[]> {
        return this.getUsers(this.URL);
    }
    getAllUsersByQuery(q): Observable<any[]> {
        return this.getUsers(this.URL + '?' + q);
    }

    getUser(id: string, options?): Observable<any> {
        let url = `${this.URL}/${id}`;
        if (options && options.forEdit) url += '?forEdit=true';
        return this.authSvc.get(url).pipe(map(model => {
            this.decryptPassword(model);
            return model;
        }))
    }


    saveConfigurations(id, model: UserConfigurationModel) {
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/users/configurations/${id}`, model).pipe(map((r: UserModel) => {
            if (r && r.configurations) {
                if (this.user && this.user._id == r._id) {
                    CacheHandler.storeUserLater(r);
                    this.user = _.cloneDeep(r);
                    this.userUpdatedSubject.next(_.cloneDeep(r));
                }
            }
            return r;
        }));
    }

    getCachedConfigurations() {
        let user: UserModel = CacheHandler.getStoredUser();
        return user && user.configurations ? user.configurations : null;
    }

    updateCachedSystemAcl(res: ProjectRoleModel) {
        let user = CacheHandler.getStoredUser();
        if (user && user.role) {
            let newRole = res.roles.find(r => r._id == user.role._id);
            if (newRole) {
                user.role = newRole;
                CacheHandler.storeUserLater(user);
                this.user = user;
                // this.toastr.success(`Admin has changed ACL permissions`, `Important Notice`, { disableTimeOut: true });
                this.aclSvc.notifyAclChanged();
            }
        }
    }

    updateCachedDptAcl(res: RoleModel[]) {
        let user = CacheHandler.getStoredUser();
        if (user && user.department && user.department.role) {
            let newRole = res.find(r => r._id == user.department.role._id);
            if (newRole) {
                user.department.role = newRole;
                CacheHandler.storeUserLater(user);
                this.user = user;
                // this.toastr.success(`Admin has changed ACL permissions`, `Important Notice`, { disableTimeOut: true });
                this.aclSvc.notifyAclChanged();
            }
        }
    }

    decryptPassword(user) {
        try { user.password = Encrytojs.decrypt(user.password, AppSettings.PWD_SECRET); } catch (err) { }
        return user;
    }

    public handleError(error: Response) {
        return Observable.throw(error || 'Server error');
    }

    getEmailCreds() {
        return this.authSvc.get(`${AppSettings.API_ENDPOINT}/email-creds?ids=all`, { fromCache: true })
    }

}
