import { AppSettings } from '@/settings';
import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonScripts } from 'src/app/scripts/CommonScripts';
import { UserService, AuthService, DashboardService } from '@/services';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material';
import { LoginModel } from '../../models';
import { CustomFormDialogComponent, AutocompleteResponseInterface } from '@/components/shared';
import { Encrytojs } from '@/scripts'

declare let $: any;
@Component({
	selector: 'login',
	templateUrl: 'login.component.html',
	styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

	registerSuspended = true;
	openFor: 'login' | 'register' | 'forgot-password' | 'reset-password' | 'activate-account' = 'login';
	@ViewChild('mForm', { static: false }) mForm;
	model: LoginModel = { email: '', password: '', phone: '923'};
	processing = false;
	animateCss = { one: `animated ${CommonScripts.getAnimateCss()}`, two: `animated ${CommonScripts.getAnimateCss()}`, three: `animated ${CommonScripts.getAnimateCss()}`, four: `animated ${CommonScripts.getAnimateCss()}` };

	showPassword = { register: false };
	resetModel = { _id: '', token: '', newPassword: '', matchPassword: '', email: '' };
	activateModel = { code: '', password: '', email: '' };
	errors;

	SITE_KEY_RECAPTCHA = AppSettings.SITE_KEY_RECAPTCHA;
	API_ENDPOINT = AppSettings.API_ENDPOINT;
	BASE_URL = AppSettings.BASE_URL;
	recaptchsResolved = false;
	recaptchaRequired = true;
	@ViewChild('recaptcha', { static: false }) recaptchaComp;

	constructor(
		public router: Router,
		private userSvc: UserService,
		private toastr: ToastrService,
		private dialog: MatDialog,
		private authSvc: AuthService,
		private route: ActivatedRoute,
		private dashboardSvc: DashboardService
	) {
		if (this.authSvc.isLoggedIn()) {
			this.router.navigate(['/dashboard']);
		}

		/* ---------------- Decide for which this component is loaded --------------- */
		if (this.router.url.startsWith('/login')) {
			this.openFor = 'login';
			this.focusControl('email');
			this.recaptchaRequired = false
		} else if (this.router.url.startsWith('/reset-password')) {
			this.openFor = 'reset-password';
			this.focusControl('email');
		} else if (this.router.url.startsWith('/register')) {
			this.openFor = 'register';
			this.focusControl('name');
		} else if (this.router.url.startsWith('/forgot-password')) {
			this.openFor = 'forgot-password';
			this.focusControl('email');
		} else if (this.router.url.startsWith('/activate-account')) {
			this.openFor = 'activate-account';
			this.focusControl('activateCode');
		}

		/* ----------------------------------- -- ----------------------------------- */

		this.route.queryParamMap.subscribe(res => {
			try {
				let queryMapEmail = res.get('email');
				if (queryMapEmail) {
					this.model.email = this.resetModel.email = queryMapEmail;
				}
			} catch (err) {
			}
			try {
				this.resetModel._id = res.get('_id');
				this.resetModel.token = res.get('token');
			} catch (err) {
			}
			try {
				this.activateModel.email = Encrytojs.decrypt(res.get('emailCrypt'))
			} catch (err) { }
		})
	}
	ngOnInit() {
	}

	@HostListener('document:keydown.enter', ['$event']) onKeydownHandler(event: KeyboardEvent) {
		if (this.mForm.valid && (!this.recaptchaRequired || this.recaptchsResolved)) {
			this.submit();
		}
	}

	submit() {
		if (!this.processing) {
			this.toastr.clear();
			this.processing = true;
			this.errors = null;
			switch (this.openFor) {
				case 'login': this.login(); break;
				case 'register': this.registerUser(); break;
				case 'forgot-password': this.forgotPassword(); break;
			}
		}
	}

	login() {
		this.toastr.clear();
		this.userSvc.login(this.model).subscribe(res => {
			this.processing = false;
			this.dashboardSvc.fetchRelease();
			let url = localStorage.getItem('rAlogin');
			if (!url || url == '/') url = '/dashboard';
			localStorage.removeItem('rAlogin');
			this.router.navigate([url]);
		}, err => {
			if (err.error.code == 411) {
				this.router.navigate([`/activate-account`], { queryParams: { emailCrypt: Encrytojs.encrypt(this.model.email) } });
			} else {
				this.dashboardSvc.showInfoDialog(err.error.message, err.error.message2, `error`);
			}
			this.processing = false;
			this.model.password = '';
		});
	}

	activateAccount() {
		this.userSvc.activateAccount(this.activateModel).subscribe((res: any) => {

			this.dashboardSvc.showInfoDialog('Your account has been activated successfully', ``, `success`, () => {
				let url = localStorage.getItem('rAlogin');
				if (!url) url = '/dashboard'; else localStorage.removeItem('rAlogin');
				this.router.navigate([url]);
			})
		}, err => {
			this.showInfoDialog(err.error.message, err.error.message2, 'error')
		})
	}

	resetPassword() {
		this.userSvc.resetPassowrd(this.resetModel).subscribe((res: any) => {
			this.showInfoDialog(res.message, '', 'success', () => {
				this.router.navigate([`/login`], { queryParams: { email: this.resetModel.email } });
			})
		}, err => {
			this.showInfoDialog(err.error.message, err.error.message2, 'error')
		})
	}

	registerUser() {
		this.userSvc.register(this.model).subscribe(res => {
			// this.toastr.success(`Your request for registration is sent`, `Wasn't that easy?`);
			this.showInfoDialog(
				`Your account has been created successfully!`,
				`You can use your provided Email (${this.model.email}) or CNIC (${this.model.cnic} without dashes) with provided password to login to the system`,
				`success`, () => {
					this.login();
					// this.router.navigate([`/activate-account`], { queryParams: { emailCrypt: Encrytojs.encrypt(this.model.email) } });
				});
			this.processing = false;
		}, err => {
			this.resetCaptcha();
			console.warn(err);
			try {
				if (err.error.err) {
					this.errors = err.error.err.errors;
				}
			} catch (err) { }
			this.processing = false;

		})
	}

	forgotPassword() {
		this.toastr.clear();
		this.userSvc.forgotPassword(this.model).subscribe((res: { message: string, message2: string }) => {
			this.showInfoDialog(res.message, res.message2 || `Please check inbox`, 'success', () => {
				this.router.navigate(['/login'])
			});
			this.processing = false;
			this.resetCaptcha();
		}, err => {
			this.showInfoDialog(err.error.message, 'Please try again', 'error', () => {
				this.model.email = '';
				this.focusControl('email');
			});
			this.processing = false;
			this.resetCaptcha();
		})
	}

	showInfoDialog(title, subTitle, dialogType: 'success' | 'error' | 'warn', callback?) {
		let dialog = this.dialog.open(CustomFormDialogComponent);
		dialog.componentInstance.dialogRole = "info";
		dialog.componentInstance.dialogType = dialogType;
		dialog.componentInstance.title = title;
		dialog.componentInstance.subTitle = subTitle;
		dialog.afterClosed().subscribe(res => {
			if (callback) callback();
		})
	}

	decideSignInUp() {
		if (this.openFor == 'login') {
			this.router.navigate(['/register'])
		} else if (['register', 'forgot-password', 'reset-password', 'activate-account'].includes(this.openFor)) {
			this.router.navigate(['/login'])
		} else {
			console.warn(`No case mathed to decide SignInUp Jump`)
		}
	}

	focusControl(id) {
		setTimeout(() => {
			try { document.getElementById(id).focus() } catch (err) { console.warn('error focusing email control id: ', id, err) }
		}, 700);
	}


	resolvedReCaptcha(e) {
		this.recaptchsResolved = !!e;
	}
	resetCaptcha() {
		this.recaptchsResolved = false;
		try { this.recaptchaComp.reset() } catch (err) { console.log("not able to reset recaptcha", err) }
	}

	dptRoles = [];
	onDepartmentSelected(e: AutocompleteResponseInterface) {
		if (e && e.model) {
			this.model.department = {
				_id: e.model._id,
				name: e.model.name,
				role: {
					_id: '',
					name: ''
				}
			}
			this.dptRoles = e.model.roles;
		} else {
			this.model.department = null;
		}
	}

	resendActivationCode() {
		this.dashboardSvc.showConfirmDialog(`Are you sure you want to request code resend?`, ``, (res) => {
			if (res) {
				this.userSvc.resendActivationCode({ email: this.activateModel.email }).subscribe((res: any) => {
					this.dashboardSvc.showInfoDialog(res.message, `Please check your phone/email inbox`, 'success');
				}, err => {
					this.dashboardSvc.showInfoDialog(err.error.message, err.error.message2, 'error');
				})
			}
		})
	}

}