import { Component, OnInit, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { DashboardService, UserService, WebsocketService, PushNotification2Service, AclService } from '@/services';
import { MatDialog } from '@angular/material';
import { AppSettings } from '@/settings';
import { CacheHandler } from '@/scripts';
import { Location } from '@angular/common';
import { CustomFormDialogComponent, ImageCropperDialogComponent, CustomFormModel } from '@/components/shared';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserConfigurationModel, UserModel } from 'src/app/modules/users-module/models';
import * as _ from 'lodash';
import { SwPush } from '@angular/service-worker';
import * as moment from 'moment';

@Component({
	selector: 'home',
	templateUrl: 'home.component.html',
	styleUrls: ['home.component.scss']
})

export class HomeComponent implements OnInit, OnDestroy {

	@ViewChild('filterResourceTrigger', { read: true, static: false }) filterResourceTrigger;
	showMenu = false;
	ngOnInit() { }
	ngOnDestroy() { this.$destroy.next(); }
	hideSideNav = false;
	isSideNavExpanded = true;
	isLeftNavShowing = true;
	isDashboard = false;
	isSmallerScreen = false;
	BASE_URL = AppSettings.BASE_URL;
	$destroy = new Subject();
	loadingModule = false;
	user: UserModel = CacheHandler.getStoredUser();

	constructor(
		public router: Router,
		public route: ActivatedRoute,
		public dashboardService: DashboardService,
		public userSvc: UserService,
		private dialog: MatDialog,
		private aclSvc: AclService,
		
	) {

		var asyncLoadCount = 0;

		this.router.events.subscribe((res: any) => {
			try {
				if (res instanceof RouteConfigLoadStart) {
					asyncLoadCount++;
				} else if (res instanceof RouteConfigLoadEnd) {
					asyncLoadCount--;
				}

				this.loadingModule = !!asyncLoadCount;
			}
			catch (err) { }
			try {
				let data = res.snapshot.data;
				if (!data.section) {
					data = res.snapshot.children[0].children[0].data;
				}
				if (!data.section) {
					data = res.snapshot.children[0].children[0].children[0].data;
				}
				if (!data.section) {
					data = res.snapshot.children[0].children[0].children[0].children[0].data;
				}
				this.dashboardService.setRouteData(data);
				this.isDashboard = this.router.url.indexOf('/dashboard') > -1;

				this.validateScreen(data);

			} catch (err) { }
		})
		this.innerWidth = window.innerWidth;
		setTimeout(() => {

			this.validateScreen(this.dashboardService.routeData);
		}, 0);

		this.dashboardService.getMenuSubject().pipe(takeUntil(this.$destroy)).subscribe(res => {
			this.hideSideNav = !!res;
		})

		this.dashboardService.getHomeEventsSubject().pipe(takeUntil(this.$destroy)).subscribe((res: { type: 'dialog-notifications', data: any }) => {
			if (res && res.type == 'dialog-notifications') {
				this.loadManageNotificationDialog(res.data);
			}
		})

	}

	toggleMenu() {
		this.showMenu = !this.showMenu;
	}

	logout() {
		this.userSvc.logout().subscribe(res => {
			this.router.navigate(['/login']);
		})
	}

	toggleSideNav() {
		this.hideSideNav = !this.hideSideNav
		if (!this.hideSideNav) {
			try { document.getElementById('main-home-container').scrollTo(0, 0); } catch (err) { }
		}
	}
	showSideNav() {
		this.hideSideNav = false;
	}

	innerWidth;
	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.innerWidth = window.innerWidth
		this.validateScreen(this.dashboardService.routeData);
	}
	validateScreen(data?) {
		this.isSmallerScreen = this.innerWidth < 765;
		this.hideSideNav = data && data.hideSideNav ? true : this.isSmallerScreen;

		this.isLeftNavShowing = !(this.isDashboard || this.isSmallerScreen);
	}

	// ====================================================== //
	//  Dialog for changing password using custom form .. how cool is that  //
	// ====================================================== //
	openChangePasswordDialog() {
		let dialog = this.dialog.open(CustomFormDialogComponent, { disableClose: true });
		dialog.componentInstance.model = [
			{
				name: 'currentPassword',
				type: 'password',
				placeholder: 'Current Password',
				required: true
			},
			{
				name: 'newPassword',
				type: 'password',
				placeholder: 'New Password',
				required: true
			},
			{
				name: 'matchPassword',
				type: 'password',
				placeholder: 'Re-Enter New Password',
				required: true
			}
		]
		dialog.componentInstance.title = "Change Password";
		dialog.componentInstance.submitUrl = `${AppSettings.API_ENDPOINT}/users/change-password`;
		dialog.componentInstance.saveBtnTxt = "Change";
		dialog.componentInstance.onSuccessMessage = `Password has been changed successfully!`;
		dialog.afterClosed().subscribe(res => {

		})
	}

	myAccount() {
		this.router.navigate([`/users/details/${this.userSvc.user._id}`])
	}

	changeDP() {
		let dialog = this.dialog.open(ImageCropperDialogComponent);
		dialog.componentInstance.roundCropper = true;
		dialog.afterClosed().subscribe(res => {
			if (res && res.base64) {
				let user = CacheHandler.getStoredUser();
				this.userSvc.updateUser({ _id: user._id, avatar: res.base64 }).subscribe((resUpdateUser: any) => {
					this.dashboardService.showInfoDialog(`Your profile picture has been changed successfully`, `<strong>Note: </strong>May be you'll need to refresh the browser to reflect the picture changes`, `success`)
					try { this.userSvc.user.avatarSrc = resUpdateUser.avatarSrc; } catch (errr) { }
				})
			}
		})
	}


	loadManageNotificationDialog(user: UserModel) {
		let model: CustomFormModel[] = [
			{ name: 'viaEmail', placeholder: 'Receive Notifications via Email', type: 'checkbox' },
			{ name: 'viaSms', placeholder: 'Receive Notifications via SMS', type: 'checkbox' },
			{ name: 'viaPushNotifications', placeholder: 'Receive Push Notifications', type: 'checkbox' }
		]
		let dialog = this.dialog.open(CustomFormDialogComponent);
		dialog.componentInstance.model = model;
		dialog.componentInstance.title = `Manage Notifications`;
		dialog.componentInstance.valueModel = user.configurations && user.configurations.notifications ? _.cloneDeep(user.configurations.notifications) : {};
		dialog.componentInstance.onlyFilledData = true;
		dialog.afterClosed().pipe(takeUntil(this.$destroy)).subscribe(res => {
			if (res) {
				if (!user.configurations) {
					user.configurations = new UserConfigurationModel();
				}
				user.configurations.notifications = res;
				this.userSvc.saveConfigurations(user._id, user.configurations)
					.pipe(takeUntil(this.$destroy)).subscribe((res: UserModel) => {
						this.dashboardService.showInfoDialog(`User configurations have been saved successfully`, ``, `success`);
						user = res;
					}, err => {
						if (err && err.error && err.error.message) {
							this.dashboardService.showInfoDialog(err.error.message, `Problem saving user configurations`, `error`);
						}
					})
			}
		})
	}

}