import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { AclService } from './acl.service';

@Injectable({
  providedIn: 'root'
})
export class CanActivateViaAuthGuard implements CanActivate {
  constructor(
    public router: Router,
    private authSvc: AuthService,
    private aclService: AclService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const url = route.url[0];
    if (!this.authSvc.isLoggedIn()) {
      localStorage.setItem("rAlogin", state.url);
      this.router.navigate(['/login'])
      return false;
    } else if(route.data.permissions) {
      if(!this.aclService.allowObj(route.data.permissions)) {
        this.router.navigate(['/login'])
        return false;
      }
    }

    return true;
  }

  canDeactivate(component: CanComponentDeactivate,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) {

    let url: string = state.url;

    return component.canDeactivate ? component.canDeactivate() : true;
  }
}

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}