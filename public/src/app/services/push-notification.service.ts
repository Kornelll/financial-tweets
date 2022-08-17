import { Injectable, ApplicationRef } from '@angular/core'
import { AppSettings } from '@/settings'
import { AuthService } from './auth.service'
import { SwUpdate } from '@angular/service-worker'
import { DashboardService } from './dashboard.service';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PushNotification2Service {
  constructor(
    private auth: AuthService,
    updates: SwUpdate,
    private dashboardSvc: DashboardService,
    appRef: ApplicationRef
  ) {


    const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
    let ms = 6 * 60 * 60 * 1000;
    const everySixHours$ = interval(ms);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(() => updates.checkForUpdate());

    updates.available.subscribe(event => {
      console.log('current version is', event.current);
      console.log('available version is', event.available);

      this.dashboardSvc.showConfirmDialog(`New version is available`, ``, (res) => {
        updates.activateUpdate().then(() => document.location.reload());
      }, `Update`, `Cancel Update`)
    });
    updates.activated.subscribe(event => {
      console.log('old version was', event.previous);
      console.log('new version is', event.current);
    });

  }

  public sendSubscriptionToTheServer(userId, subscription: PushSubscription) {
    return this.auth.post(`${AppSettings.API_ENDPOINT}/subscription/${userId}`, subscription)
  }
}