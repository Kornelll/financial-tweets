import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UserService, DashboardService } from '@/services';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserModel, UserConfigurationModel } from '../../models';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppSettings } from '@/settings';
import { AutocompleteResponseInterface, CustomFormModel, CustomFormDialogComponent } from 'src/app/components';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {

  userId: string;
  $destroy = new Subject();

  model: UserModel = new UserModel();

  BASE_URL = AppSettings.BASE_URL;
  DEPARTMENT_URL = `${AppSettings.API_ENDPOINT}/departments?perPage=20&name=`;

  selectedTab: 'contact' | 'skills' | 'my-complaints' | 'related-complaints' | 'activity-log';
  categoryTypesSelectConfigs = [];


  departmentRoles = [];
  @ViewChild('emailControl', { static: false }) emailControl;
  @ViewChild('phone', { static: false }) phoneControl;

  constructor(
    private userSvc: UserService,
    public router: Router,
    private route: ActivatedRoute,
    public spinner: NgxSpinnerService,
    private dashboardSvc: DashboardService,
    private dialog: MatDialog
  ) {
    this.route.params.pipe(takeUntil(this.$destroy)).subscribe(res => {
      this.userId = res['userId'];
      try {
        if (this.userSvc.user && this.userId == this.userSvc.user._id) {
          this.userSvc.getUserUpdatedSubject().pipe(takeUntil(this.$destroy)).subscribe((res: UserModel) => {
            this.model = res;
          })
        }
      } catch (err) {

      }
      this.fetchUser();
      this.fetchStats();
    })
  }

  ngOnInit() {
  }
  ngOnDestroy() {
    this.$destroy.next();
  }

  stats: {
    submittedComplaints: any,
    receivedForApprovalComplaints: any,
    assignedComplaints: number,
    resolvedComplaints: number,
    rejectedComplaints: number,
    onHoldComplaints: number,
    approvedComplaints: number,
    performance: number
  }
  fetchStats() {

    // this.complaintSvc.getUserComplaintStats(this.userId).pipe(takeUntil(this.$destroy)).subscribe(res => {
    //   this.stats = res;
    //   this.stats.performance = (this.stats.assignedComplaints || 0) + (this.stats.resolvedComplaints || 0) + (this.stats.rejectedComplaints || 0) + (this.stats.receivedForApprovalComplaints ? this.stats.receivedForApprovalComplaints.receivedForApprovalComplaints : 0);
    //   this.stats.performance = 100 * ((this.stats.resolvedComplaints || 0) / (this.stats.performance || 1));
    // })
  }

  fetchUser() {
    this.spinner.show();
    this.userSvc.getUser(this.userId).pipe(takeUntil(this.$destroy)).subscribe(res => {
      this.model = res;
      this.spinner.hide();
      this.setSelectedTab('contact');
      if (!this.model.skillCategories || !this.model.skillCategories.length) {
        this.addLineItemCategory();
      } else {
        this.categoryTypesSelectConfigs.length = 0;
        this.model.skillCategories.forEach(cat => {
          this.categoryTypesSelectConfigs.push(this.getSelectConfig(cat));
        })
      }
    }, err => {
      this.spinner.hide();
    })
  }

  setSelectedTab(tabKey: 'contact' | 'skills' | 'my-complaints' | 'related-complaints' | 'activity-log') {
    this.selectedTab = tabKey;
  }


  onDepartmentSelect(e: AutocompleteResponseInterface) {
    if (e && e.model) {
      this.model.department._id = e.model._id;
      this.model.department.name = e.model.name;
      this.departmentRoles = _.unionBy(this.departmentRoles, (e.model.roles || []));
      if (e.options && e.options.emittedWhenInput) {
        this.departmentRoles.push(this.model.department.role)
      }
    } else {
      delete this.model.department._id;
      delete this.model.department.name;
      this.model.department.role = { _id: '', name: '' };
      this.departmentRoles = [];
    }
  }

  saveContactInformation() {
    this.dashboardSvc.showConfirmDialog(`Are you sure you want to save contact information?`, ``, (res) => {
      if (res) {
        this.spinner.show();
        this.userSvc.updateUser(this.model).pipe(takeUntil(this.$destroy)).subscribe((resUser: UserModel) => {
          this.dashboardSvc.showInfoDialog(`Contact information has been saved successfully`, ``, `success`, () => {
            this.model = resUser;
          });
          this.spinner.hide();
        }, err => {
          this.handleApiErrorResponse(err);
        })
      }
    })
  }

  handleApiErrorResponse(err) {
    this.spinner.hide();
    try { var errors = err.error.errors || err.error.err.errors; } catch (err) { }
    try { if (errors.email) this.emailControl.control.setErrors({ apiError: errors.email.message }); } catch (err) { }
    try { if (errors.phone) this.phoneControl.control.setErrors({ apiError: errors.phone.message }); } catch (err) { }
    scrollTo(0, 0);
  }

  reset() {
    this.dashboardSvc.showConfirmDialog(`Are you sure you want to reset the changes?`, ``, (res) => {
      if (res) {

      }
    });
  }

  addLineItemCategory(eraseFirst?) {
    if (eraseFirst || !this.model.skillCategories) {
      try { this.model.skillCategories.length = 0; } catch (err) { try { this.model.skillCategories = [] } catch (err) { } }
      try { this.categoryTypesSelectConfigs.length = 0; } catch (err) { this.categoryTypesSelectConfigs = [] }
    }
    let obj = {};
    this.model.skillCategories.push(obj);
    this.categoryTypesSelectConfigs.push(this.getSelectConfig(obj));
  }

  getSelectConfig(obj) {
    return {
      // departmentId: this.model.department._id,

      bindCategoryId: true,
      modelCategoryField: 'category',
      bindCategoryResponseField: '_id',

      typeMulti: true,

      modelTypeField: 'types',
      bindTypeResponseField: '_id',

      bindModel: obj

    }
  }
  removeLineItemCategory(i) {
    this.dashboardSvc.showConfirmDialog(`Are you sure you want to remove this category line item`, `Related types selection will be lost`, (res) => {
      if (res) {
        this.model.skillCategories.splice(i, 1);
      }
    })
  }

  loadManageNotificationDialog() {
    this.dashboardSvc.publishHomeEvent('dialog-notifications', this.model)
  }

}
