import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { UserService, AclService } from '@/services';
import { ImageCropperDialogComponent, AutocompleteResponseInterface } from '@/components/shared';
import { UserModel } from '../../models';
import { AppSettings } from '@/settings';

@Component({
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  styleUrls: ['./user-add.component.scss']
})
export class UserAddComponent implements OnInit {
  @ViewChild('emailControl', { static: false }) emailControl;
  @ViewChild('phone', { static: false }) phoneControl;

  model: UserModel = new UserModel();
  updateMode = false;
  submitted: Boolean;
  statusOptions: any[];
  currentRoute: string;
  public roles: Array<Object>;
  public selectedId = '';
  passwordType = 'password';
  statuses = [];
  waitFor = { verticals: false, statuses: false, roles: false };
  notifyApproval = false;

  BASE_URL = AppSettings.BASE_URL;
  DEPARTMENT_URL = `${AppSettings.API_ENDPOINT}/departments?perPage=20&name=`;
  API_ENDPOINT = AppSettings.API_ENDPOINT;
  departmentRoles = [];

  constructor(
    public _userService: UserService,
    public route: ActivatedRoute, public router: Router,
    public aclService: AclService,
    public dialog: MatDialog
  ) {
    this.generateStatusOptions();
  }

  ngOnInit() {
    this.getRoles();
    this.route.params.subscribe(params => {
      this.currentRoute = this.route.url['_value'][0].path;

      this.selectedId = params['userId'];
      if (this.selectedId) {
        this.fetchUserDetail();
      }
    });
  }

  getRoles() {
    if (this.aclService.allowObj({ app: { codes: ['acl_view', 'user_view_all'], logic: 'or' } })) {
      this.waitFor.roles = true;
      this.aclService.getProjectRoles()
        .subscribe(
          //-- RESPONSE
          res => {
            this.roles = res.roles;
            delete this.waitFor.roles;
          },

          //-- ERROR
          err => {
            delete this.waitFor.roles;
          },

          //-- COMPLETION
          () => { }
        );
    }
  }

  fetchUserDetail() {
    this._userService.getUser(this.selectedId, { forEdit: true }).subscribe(result => {

      if (!result.department || !result.department._id) {
        result.department = {
          _id: '',
          name: '',
          role: {
            _id: '',
            name: ''
          }
        }
      } else {
        let dptRole = result.department.role;
        result.department = <any>result.department._id;
        setTimeout(() => {
          result.department.role = dptRole
        }, 200);
      }

      this.model = result;
      this.updateMode = true;
    },
      err => {
        // this.handleError(err);
      }
    );
  }

  saveUser() {
    if (!this.submitted) {
      this.submitted = true;
      this.model['notifyApproval'] = this.notifyApproval;
      if (!this.updateMode) {
        this._userService.saveUser(this.model).subscribe(result => {
          // this.toast.open('New User Created', 'close', { duration: 3500 });
          this.goBack();
        },
          err => {
            this.submitted = false;
            this.handleApiErrorResponse(err)
          });
      } else {
        if (!this.model.password) delete this.model.password;
        this._userService.updateUser(this.model).subscribe(result => {
          // this.toast.open('User Updated', 'close', { duration: 3500 });
          this.goBack();
        },
          err => {
            this.submitted = false;
            this.handleApiErrorResponse(err)
          });
      }
    }
  }
  handleApiErrorResponse(err) {
    try { var errors = err.error.errors || err.error.err.errors; } catch (err) { }
    try { if (errors.email) this.emailControl.control.setErrors({ apiError: errors.email.message }); } catch (err) { }
    try { if (errors.phone) this.phoneControl.control.setErrors({ apiError: errors.phone.message }); } catch (err) { }
    scrollTo(0, 0);
  }
  generateStatusOptions() {
    this.statusOptions = [
      { label: 'Approved', value: "approved" },
      { label: 'Wait for approval', value: "waiting" }
    ];
  }
  toggle_password(target) {
    if (this.passwordType === 'text') {
      this.passwordType = 'password';
    } else {
      this.passwordType = 'text';
    }
  }
  selectAvatar() {
    let dialog = this.dialog.open(ImageCropperDialogComponent);
    dialog.componentInstance.roundCropper = true;
    dialog.afterClosed().subscribe(result => {
      if (result) {
        this.model.avatar = result.base64;
      }
    })
  }
  goBack() {
    this.router.navigate(['/users']);
  }

  compareObjectsRole(o1: any, o2: any): boolean {
    return o1 && o2 && o1._id === o2._id;
  }

  onDepartmentSelect(e: AutocompleteResponseInterface) {
    if (e && e.model) {
      if (this.model.department._id != e.model._id) {
        this.model.department.role = { _id: '', name: '' };
      }
      this.model.department._id = e.model._id;
      this.model.department.name = e.model.name;
      this.departmentRoles = e.model.roles;
    } else {
      delete this.model.department._id;
      delete this.model.department.name;
      this.departmentRoles = [];
      this.model.department.role = { _id: '', name: '' };
    }
  }

}