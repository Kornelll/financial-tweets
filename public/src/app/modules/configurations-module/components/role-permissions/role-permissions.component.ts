import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { CustomFormDialogComponent, CustomFormModel } from '../../../shared-module/components';
import { AclService, DashboardService } from '@/services';
import { Router } from '@angular/router';
import { RoleModel, ProjectRoleModel } from '../../models';
import { AppSettings } from '@/settings';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
	selector: 'app-role-permissions',
	templateUrl: './role-permissions.component.html',
	styleUrls: ['./role-permissions.component.scss']
})

export class RolePermissionsComponent implements OnInit {

	roles: RoleModel[];
	selectedIndex;
	selectedRole: RoleModel;
	loading = true;
 
	constantRolesNameList = ["user", "admin"];
	canEditRoles = false;

	$destroy = new Subject();

	constructor(
		public dialog: MatDialog,
		public toastr: ToastrService,
		public aclService: AclService,
		public cd: ChangeDetectorRef,
		public ngZone: NgZone,
		public router: Router,
		public spinner: NgxSpinnerService,
		private dashboardSvc: DashboardService
	) {
		this.canEditRoles = this.aclService.allow("role_edit");
		this.getProjectRoles();
	}
	ngOnInit() {
	}
	ngOnDestroy() {
		this.$destroy.next();
	}

	getProjectRoles() {
		this.spinner.show();
		this.aclService.getProjectRoles().pipe(takeUntil(this.$destroy)).subscribe(res => {
			this.roles = res.roles;
			if (res.roles && res.roles.length) {
				this.selectRole(0);
				this.checkForConstantRoles();
			}
			this.loading = false;
			this.spinner.hide();
		}, err => {
			this.spinner.hide();
			if (err.status == 0) {
				this.toastr.error("Acl service is down", "Try again later!");
			}
			console.warn("Acl service error", err);
			this.loading = false;
		})
	}

	model: any = {
		// sample
		// "target~target_add": true,
		// "target~target_edit": true
	};

	allPermissions = AppSettings.PERMISSIONS;
	selectRole(i) {
		if (i == -1 || !this.roles || !this.roles.length) {
			this.selectedRole = null;
			this.selectedIndex = null;
			return;
		}
		this.selectedRole = this.roles[i];
		this.selectedIndex = i;
		this.calculateSelectedPermissions();
	}

	calculateSelectedPermissions() {
		this.model = this.selectedRole.permissions.reduce((arr, item) => {
			arr[`${item.module}~${item.code}`] = true;
			return arr;
		}, {});
		this.verifyAllModuleCheckedAll();
	}



	selectWholeModule(e, permissionSet) {
		permissionSet.permissions.forEach(p => {
			if (e.checked) {
				this.model[`${permissionSet.module}~${p.code}`] = true;
			} else {
				delete this.model[`${permissionSet.module}~${p.code}`];
			}
		})
	}
	selectPermission(e, permissionSet, permission) {
		if (!e.checked) {
			delete this.model[`${permissionSet.module}~${permission.code}`]
		}
		this.verifyModuleCheckedAll(permissionSet);
	}
	verifyAllModuleCheckedAll() {
		this.allPermissions.forEach(permissionSet => this.verifyModuleCheckedAll(permissionSet));
	}
	verifyModuleCheckedAll(permissionSet) {
		delete permissionSet.indeterminate;
		permissionSet.checkedAll = true;
		permissionSet.permissions.forEach(p => {
			if (this.model[`${permissionSet.module}~${p.code}`]) {
				permissionSet.indeterminate = true;
				return true;
			}
			delete permissionSet.checkedAll;
		})
		if (permissionSet.checkedAll) {
			delete permissionSet.indeterminate;
		}
	}
	resetSelection() {
		let dialog = this.dialog.open(CustomFormDialogComponent);
		dialog.componentInstance.dialogRole = "confirm";
		dialog.componentInstance.title = "Are you sure you want to reset permissions?";
		dialog.afterClosed().subscribe(res => {
			if (res) {
				this.calculateSelectedPermissions();
			}
		})
	}
	savePermissions() {
		this.dashboardSvc.showConfirmDialog(`Are you sure you want to save permissions`, ``, (confirm) => {
			if (confirm) {
				let modelToSubmit: RoleModel = {
					name: this.selectedRole.name,
					permissions: [],
					description: ''
				};
				Object.keys(this.model).forEach(key => {
					if (this.model[key]) {
						let parts = key.split("~");
						let permission = {
							module: parts[0],
							code: parts[1],
							name: ''
						};
						try {
							let result = _.chain(this.allPermissions)
								.map('permissions')               // pluck all elements from data
								.flatten()                     // flatten the elements into a single array
								.filter({ code: permission.code })         // exatract elements with a prop of 'foo'
								.value()
							permission.name = result[0].name;
						} catch (err) { }
						modelToSubmit.permissions.push(permission);
					}
				})
				this.aclService.saveProjectRolePermissions(this.selectedRole._id, modelToSubmit).subscribe(res => {
					this.roles = res.roles;
					this.checkForConstantRoles();
					this.dashboardSvc.showInfoDialog(`${modelToSubmit.name} permissions have been saved successfully!`, ``, `success`);
					// this.toastr.success(`Permissions are saved`, `Success`);
				})
			}
		})
	}

	roleFormModel: CustomFormModel[] = [
		{
			name: 'name',
			type: 'text',
			placeholder: 'Name',
			required: true,
			checkDuplicate: true,
			uniqueKey: '_id',
			maxlength: 20
		},
		{
			name: 'description',
			type: 'textarea',
			placeholder: 'Description'
		}
	]
	addNewRole() {
		let dialog = this.dialog.open(CustomFormDialogComponent, { disableClose: true });
		dialog.componentInstance.model = this.roleFormModel;
		dialog.componentInstance.title = "Add Role";
		dialog.componentInstance.alreadyList = this.roles;
		dialog.componentInstance.onlyFilledData = true;
		dialog.afterClosed().subscribe(res => {
			if (res) {
				let modelToSubmit: ProjectRoleModel = {
					model: {
						_id: "1",
						name: "excalibur",
						typeOfModel: "application"
					},
					role: res
				}
				this.aclService.addProjectRole(modelToSubmit).subscribe(res => {
					this.dashboardSvc.showInfoDialog(`New role has been added successfully`, ``, `success`);
					// this.toastr.success(`New role has been added successfully`, `Success`);
					this.roles = res.roles;
					if (res.roles && res.roles.length) {
						this.checkForConstantRoles();
						this.selectRole(this.roles.length - 1);
					}
				}, err => {
					if (err.status == 0 || err.statusText == "Not Found") {
						this.toastr.error("Acl service is down", "Try again later!");
					}
					console.warn("Acl service error", err);
				})
			}
		})
	}
	editRole($event, role: RoleModel, i) {
		let dialog = this.dialog.open(CustomFormDialogComponent, { disableClose: true });
		dialog.componentInstance.valueModel = JSON.parse(JSON.stringify(role));
		dialog.componentInstance.model = this.roleFormModel;
		dialog.componentInstance.title = "Edit Role";
		dialog.componentInstance.alreadyList = this.roles;
		dialog.componentInstance.onlyFilledData = true;
		dialog.afterClosed().subscribe(res => {
			if (res) {
				let modelToSubmit: RoleModel = res;
				this.aclService.saveProjectRolePermissions(role._id, modelToSubmit).subscribe(res => {
					this.dashboardSvc.showInfoDialog(`Role has been updated successfully`, ``, `success`);
					// this.toastr.success(`Role has been updated successfully`, `Success`);
					this.roles = res.roles;
					if (res.roles && res.roles.length) {
						this.checkForConstantRoles();
						this.selectRole(this.roles.length - 1);
					}
				})
			}
		})
	}

	deleteRole(e, role, i) {
		try { e.stopPropagation(); } catch (err) { }
		let dialog = this.dialog.open(CustomFormDialogComponent);
		dialog.componentInstance.dialogRole = "confirm";
		dialog.componentInstance.title = "Are you sure to remove this role?";
		dialog.afterClosed().subscribe(res => {
			if (res) {
				this.aclService.deleteProjectRole(role._id).subscribe(res => {
					if (res) {
						this.dashboardSvc.showInfoDialog(`Role has been deleted successfully`, ``, `success`);
						// this.toastr.success(`Role has been deleted successfully`, `Success`);
						this.roles.splice(i, 1);
						if (i <= this.selectedIndex) {
							this.selectedIndex--;
							this.selectRole(this.selectedIndex);
						}
					}
				})
			}
		})
	}
	goBack() {
		let dialog = this.dialog.open(CustomFormDialogComponent);
		dialog.componentInstance.dialogRole = "confirm";
		dialog.componentInstance.title = "Are you sure to discard changes and go back?";
		dialog.afterClosed().subscribe(res => {
			if (res) {
				this.router.navigate(['/configurations/dashboard']);
			}
		})
	}

	checkForConstantRoles() {
		this.roles = (this.roles || []).map(r => {
			if (this.constantRolesNameList.includes(r.name.toLowerCase())) {
				r.constant = true;
			}
			return r;
		})
	}
}