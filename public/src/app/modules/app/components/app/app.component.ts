import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DashboardService, PushNotification2Service } from '@/services';
import { CustomFormDialogComponent } from '@/components/shared';
import { SwPush } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isIframe = false;
  constructor(
    private dialog: MatDialog,
    private dashboardSvc: DashboardService,
  ) {
    this.initGlobalDialog();
    this.isIframe = (window.location !== window.parent.location);
  }

  ngOnInit() {
    // this.myFunction();
  }

  /* ============================================================================================================ */
  /*
    Global dialog (for info, success, errro alerts) for the app
    just call dashboardService.showInfoDialog(title, subTitle, dialogType: 'success' | 'error' | 'warn', callback?)
    or publish next() to dashboardService.dialogSubject -> { dialogRole: 'info', dialogType, title, subTitle, callback }
    would do it */
  /* ------------------------------------------------------------------------------------------------------------ */
  initGlobalDialog() {
    this.dashboardSvc.getDialogSubject().subscribe((res: any) => {
      if (res) {
        if (res.dialogRole == 'info') {
          this.showInfoDialog(res.title, res.subTitle, res.dialogType, res.callback, res.dontShowButtonLocalStorageKey)
        } else if (res.dialogRole == 'confirm') {
          this.showConfirmDialog(res.title, res.subTitle, res.callback, res.yesButtonText, res.noButtonText);
        }
      }
    })
  }
  showInfoDialog(title, subTitle, dialogType: 'success' | 'error' | 'warn' | 'info', callback?, dontShowButtonLocalStorageKey?) {
    if(dontShowButtonLocalStorageKey) {
      if(localStorage.getItem(dontShowButtonLocalStorageKey)) {
        return;
      }
    }
    let dialog = this.dialog.open(CustomFormDialogComponent);
    dialog.componentInstance.dialogRole = "info";
    dialog.componentInstance.dialogType = dialogType;
    dialog.componentInstance.title = title;
    dialog.componentInstance.subTitle = subTitle;
    dialog.afterClosed().subscribe(res => {
      if (callback) callback(res);
    })
  }
  showConfirmDialog(title, subTitle, callback?, yesButtonText?, noButtonText?) {
    let dialog = this.dialog.open(CustomFormDialogComponent);
    dialog.componentInstance.dialogRole = "confirm";
    dialog.componentInstance.title = title;
    dialog.componentInstance.subTitle = subTitle;
    dialog.componentInstance.saveBtnTxt = yesButtonText || 'Yes';
    dialog.componentInstance.cancelBtnTxt = noButtonText || 'No';
    dialog.afterClosed().subscribe(res => {
      if (callback) callback(res);
    })
  }
  /* ============================================================================================================ */
}
