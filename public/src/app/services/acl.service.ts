import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AppSettings } from '../app.settings';
import { ProjectRoleModel, RoleModel, PermissionModel } from '../modules/configurations-module/models';
import { Encrytojs } from '../scripts/crypto';
import { AclInterface } from '@/directives';
import { CacheHandler } from '@/scripts';
import { UserModel } from '../modules/users-module/models';


@Injectable({
    providedIn: 'root'
})
export class AclService {

    private aclChangedSubject = new Subject();

    constructor(private http: AuthService) {
    }
    addProjectRole(model: ProjectRoleModel): Observable<any> {
        return this.http.post(`${AppSettings.API_ENDPOINT}/project-roles/role`, model).pipe(map((r: any) => {
            try { return <any>JSON.parse(r._body); } catch (err) { return r }
        }))
    }
    getProjectRoles(): Observable<any> {
        return this.http.get(`${AppSettings.API_ENDPOINT}/project-roles/getByKey/acl`).pipe(map((r: any) => {
            // try { return <any>JSON.parse(r._body); } catch (err) { return r }
            return r;
        }))
    }
    deleteProjectRole(roleId): Observable<any> {
        return this.http.delete(`${AppSettings.API_ENDPOINT}/project-roles/role/${roleId}/application`).pipe(map((r: any) => {
            try { return <any>JSON.parse(r._body); } catch (err) { return r }
        }))
    }
    saveProjectRolePermissions(roleId, model: RoleModel) {
        return this.http.put(`${AppSettings.API_ENDPOINT}/project-roles/role/${roleId}`, model).pipe(map((r: any) => {
            try { return <any>JSON.parse(r._body); } catch (err) { return r }
        }))
    }

    getMyPermissions(): PermissionModel[] {
        let user: UserModel = CacheHandler.getStoredUser();
        return user && user.role && user.role.permissions && user.role.permissions.length ? user.role.permissions : [];
    }
    getMyDptPermissions(): PermissionModel[] {
        let user: UserModel = CacheHandler.getStoredUser();
        return user && user.department && user.department.role && user.department.role.permissions && user.department.role.permissions.length ? user.department.role.permissions : [];
    }
    allow(permission): boolean {
        return !!this.getMyPermissions().find(perm => perm.module == permission || perm.code == permission);
    }

    allowDpt(permission): boolean {
        return !!this.getMyDptPermissions().find(perm => perm.module == permission || perm.code == permission);
    }

    allowObj(obj: AclInterface) {

        let condition = false;

        if (obj.app) {
            let applevel = obj.app;
            if (!applevel.logic) {
                applevel.logic = 'and';
            }

            if (applevel.logic == 'and') {
                condition = true;
                for (let i = 0; i < applevel.codes.length; i++) {
                    if (!this.allow(applevel.codes[i])) {
                        condition = false;
                        break;
                    }
                }
            } else {
                condition = false;
                for (let i = 0; i < applevel.codes.length; i++) {
                    if (this.allow(applevel.codes[i])) {
                        condition = true;
                        break;
                    }
                }
            }
        }

        return condition;

    }

    allowComplaint(complaint, user?) {
        if (!complaint) return true;
        if (!user) user = CacheHandler.getStoredUser();
        if (user) {
            return (
                (typeof complaint.department == 'string' && complaint.department == user.department._id)
                ||
                (typeof complaint.department == 'object' && complaint.department._id == user.department._id)
            )
        } else return false;
    }

    allowUser(obj: AclInterface, allowedUserId, allowedUserDepartmentId, ignoreCodesIfSameUser) {
        let user = CacheHandler.getStoredUser();
        let allowed = { allowed: false, message: `Not yet decided` };

        try {
            if (user._id.toString() == allowedUserId) {
                if (!ignoreCodesIfSameUser) {
                    allowed = { allowed: this.allowObj(obj), message: `Function Called` };
                } else {
                    allowed = { allowed: true, message: `allowing because of same user, ignoreCodesIfSameUser: ${ignoreCodesIfSameUser}` }
                }
            } else {
                if (allowedUserDepartmentId == user.department._id) {
                    allowed = { allowed: this.allowObj(obj), message: `Function Called` };
                } else {
                    allowed = { allowed: false, message: 'You cannot access user of external department' };
                }
            }
        } catch (err) {
            allowed = { allowed: false, message: 'Not allowing (because of possible crash), some cases when department role is mis-mapped, Please re-select user department role' };
        }
        return allowed;
    }

    getAclChangedSubject() {
        return this.aclChangedSubject;
    }
    notifyAclChanged() {
        this.aclChangedSubject.next(true);
    }
}
