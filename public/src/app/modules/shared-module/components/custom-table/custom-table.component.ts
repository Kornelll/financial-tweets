import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';

import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatPaginator, MatDialog } from '@angular/material';
import { Subject, } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DashboardService, AuthService, AclService } from '@/services';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CustomTableResolvers } from './custom-table.resolvers';
import * as _ from 'lodash';
import { DotfieldPipe } from 'src/app/pipes';
import { CustomTableConfig, CustomTableEvents, CutomTableUrlCheckbox } from './interfaces/';
import { CommonScripts } from '@/scripts';
import { DynamicComponentDialogComponent, CustomFormDialogComponent } from '@/components/shared';
import { AppSettings } from '@/settings';
import { FormControl, Validators } from '@angular/forms';
import { CsvUploaderComponent, CsvUploaderInterface } from '../csv-uploader/csv-uploader.component';
import { NgxSpinnerTypes } from './ngx-spinner-types';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss']
})
export class CustomTableComponent implements OnInit {
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  model: any = null;

  subscriber;

  commonScripts = CommonScripts;
  serachControl = new FormControl();
  selectFilterValueModel: string;

  readonly = false;

  displayedColumns = [];
  exportFileName: string = 'Export file';
  initDisplayColumn() {
    this.displayedColumns = (this.config.bulkOps ? ['select'] : []).concat(Object.keys(this.model));
    try {
      this.config.icons = this.config.icons.filter(icon => !icon.permissions || this.aclSvc.allowObj(icon.permissions))
    } catch (err) { }
    try {
      if ((this.config.icons && this.config.icons.length) || ((this.config.edit && this.config.edit.enabled) || (this.config.delete && this.config.delete.enabled))) {
        this.displayedColumns.push('actions');
      }
    } catch (err) { }
  }
  $destroy = new Subject();
  allRecords: any[] = [];
  data;

  BASE_URL = AppSettings.BASE_URL;

  @Output() events: EventEmitter<CustomTableEvents> = new EventEmitter();

  _config: CustomTableConfig;
  @Input() set config(config) {
    this._config = config;
    if (config) {
      if (config.allRecordsLocal) {
        this.allRecords = config.allRecordsLocal;
        this.setTableDataAfterDataDecided(this.allRecords);
      }

      this.checkForSelectFiltersUrlData();
      if (config.readonlyPermissions) {
        this.readonly = this.aclSvc.allowObj(config.readonlyPermissions);
      }

      this.exportFileName = `${this.config.title} Export at ${moment().format("DD-MMM-YYYY hh-mm-ss a")}`
    }
  }
  get config() {
    return this._config;
  }

  // when using inline append submit url
  @Input() formSubmitUrlPostfix: string;

  routeQueryParamsMap;
  waitingApi: boolean = false;
  spinnerType = 'ball-circus';
  NgxSpinnerTypes = NgxSpinnerTypes;

  constructor(
    public authService: AuthService,
    public dashboardService: DashboardService,
    public router: Router,
    public spinner: NgxSpinnerService,
    public dialog: MatDialog,
    public toastr: ToastrService,
    private route: ActivatedRoute,
    private customTableResolvers: CustomTableResolvers,
    private aclSvc: AclService
  ) {
    // this.openCsvUploaderDialog();
    this.randomizeNgxSpinnerType();
  }
  initSetup() {
    if (!this.config) {
      console.warn("no config found for custom-table");
      return;
    }
    //
    this.checkForSelectFiltersUrlData();
    //
    this.model = this.config.tableModel;
    this.initDisplayColumn();
    this.modelChanged.pipe(
      debounceTime(600), // wait 600ms after the last event before emitting last event
      distinctUntilChanged(), // only emit if value is different from previous value
    ).subscribe(e => {
      if (e.colDef) {
        this.model[e.colDef].value = e.text;
        this.getSearchQuery();
      }
      if (this.config.apiSearch) {
        this.fetchData();
      } else {
        this.filterAndSetTable();
      }
    });
    this.getSearchQuery();
    this.fetchData();

    this.serachControl.valueChanges.pipe(debounceTime(700)).subscribe(res => {
      if (this.config.customSearch && this.config.customSearch.apiSearch) {
        this.fetchData({ ignoreSpinner: true });
      } else {
        try { this.dataSource.filter = res.toLowerCase(); } catch (err) { }
      }
    })
  }

  checkForSelectFiltersUrlData() {
    if (this.config) {

      if (this.config.selectFilters && this.config.selectFilters.length) {
        this.config.selectFilters.forEach(selectFilter => {
          if (selectFilter && selectFilter.url) {
            let url = selectFilter.url;
            if (selectFilter.urlQuery) {
              url += `?${selectFilter.urlQuery}`;
            }
            this.authService.get(url, selectFilter.urlOptions).subscribe(result => {
              if (selectFilter.responseField) {
                selectFilter.externalData = result[selectFilter.responseField];
              } else {
                selectFilter.externalData = result;
              }
            })
          }
        })
      }
    }
  }

  filterAndSetTable() {
    let filteredArray = this.allRecords.slice();
    Object.keys(this.model).forEach(key => {
      if (this.model[key].value) {
        filteredArray = filteredArray.filter(r => DotfieldPipe.dottedField(r, key) && `${DotfieldPipe.dottedField(r, key)}`.toLowerCase().indexOf(this.model[key].value.toLowerCase()) > -1);
      }
    });
    this.setTableDataAfterDataDecided(filteredArray);
  }

  setTableDataAfterDataDecided(data) {
    this.dataSource = new MatTableDataSource<any>(data);
    try { this.dataSource.sort = this.sort; } catch (err) { }
    this.spinner.hide();
    this.waitingApi = false;
    this.dataSource.sortingDataAccessor = (item, property) => {
      return DotfieldPipe.dottedField(item, property);
    };
  }

  fetchData(options?: { ignoreSpinner: boolean }) {
    if (!this.config || !this.config.url) {
      return;
    }
    this.randomizeNgxSpinnerType();
    if (this.config.urlOptions) {
      if (!options) options = <any>{};
      options = {
        ...options,
        ...this.config.urlOptions
      }
    }
    this.waitingApi = true;
    if (!(options && options.ignoreSpinner)) {
      this.spinner.show();
    }
    setTimeout(() => {
      this.selection.clear();
      let url = `${this.getParamUrl()}?${this.config.urlQuery ? this.config.urlQuery + '&' : ''}`;
      if (this.config.pagination) {
        url += `${this.config.pagination.perPageField}=${this.paginator ? this.paginator.pageSize : this.config.pagination.perPage}&${this.config.pagination.pageField}=${this.paginator ? this.paginator.pageIndex + 1 : 1}`;
      }
      if (this.query) {
        url += this.query;
      }
      if (this.config.customSearch && this.serachControl.value && this.config.customSearch.apiSearch && this.config.customSearch.apiQueryField) {
        url += `&${this.config.customSearch.apiQueryField}=${this.serachControl.value}`;
      }
      if (this.config.urlCheckboxs && this.config.urlCheckboxs.length) {
        this.config.urlCheckboxs.forEach(c => {
          if (c.value && c.paramField) {
            url += `&${c.paramField}=${c.value}`
          }
        })
      }
      //
      if (this.config.selectFilters && this.config.selectFilters.length) {
        this.config.selectFilters.forEach(selectFilter => {
          if (selectFilter.valueModel) {
            url += `&${selectFilter.name}=${selectFilter.valueModel}`;
          }
        });
      }
      //
      try { this.subscriber.unsubscribe() } catch (err) { }
      this.subscriber = this.authService.get(url, options).pipe(takeUntil(this.$destroy)).subscribe(res => {
        this.data = res;
        if (this.config.pagination && this.config.pagination.responseField) {
          this.allRecords = DotfieldPipe.dottedField(res, this.config.pagination.responseField);
        } else if (this.config.responseFieldWithoutPagination) {
          this.allRecords = res[this.config.responseFieldWithoutPagination];
        } else {
          this.allRecords = res;
        }

        if (this.config.callbackOnResponse) {
          this.customTableResolvers[this.config.callbackOnResponse](this.allRecords);
        }
        if (this.config.apiSearch) {
          this.setTableDataAfterDataDecided(this.allRecords);
        } else {
          // this.modelChanged.next({ text: '', colDef: null });
          this.filterAndSetTable();
        }

        this.emitEvent({ data: this.allRecords, event: 'api-data-loaded' });
      }, err => {
        this.spinner.hide();
        this.waitingApi = false;
        this.toastr.clear();
        let message = "Something went wront!";
        let message2 = "Ops";
        if (err && err.error && err.error.message) {
          message = err.error.message;
          message2 = err.error.message2 || message2;
        }
        if (err.status != 401) {
          // Auth service will show error message in that case, so need of extra toast
          this.toastr[err.status == 429 ? "warning" : "info"](message, message2);
        }
        console.warn(err);
      })
    }, 0);
  }

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  /////////////////////
  dataSource = new MatTableDataSource<any>(this.allRecords);
  selection = new SelectionModel<any>(true, []);

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.dataSource.data.forEach(row => {
        delete row.selected;
      });
    } else {
      this.dataSource.data.forEach(row => {
        this.selection.select(row);
        row.selected = true;
      });
    }
  }

  toggleSelection(row) {
    this.selection.toggle(row);
    this.selection.isSelected(row) ? row.selected = true : delete row.selected;
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  rowClicked(row) {
    let primaryKey = this.config.primaryKey;
    let record = this.allRecords.find(r => DotfieldPipe.dottedField(r, primaryKey) == DotfieldPipe.dottedField(row, primaryKey))
    if (record) {
      row = record;
    }
    if (this.config.rowClicked) {
      switch (this.config.rowClicked.type) {
        case "link":
          let route = this.config.rowClicked.data;
          let url = this.interpolatePopulateVariableInString(row, route, "~~");
          this.router.navigate([url]);
          break;
        case "component":
          let dialog2 = this.dialog.open(DynamicComponentDialogComponent);
          dialog2.componentInstance.component = this.config.rowClicked.data.component;
          dialog2.componentInstance.loadComponent([{ field: 'model', value: _.cloneDeep(row) }]);
          if (this.config.rowClicked.fetchAfterSuccess) {
            dialog2.componentInstance.dialogRef.afterClosed().subscribe(res => {
              if (res) {
                this.fetchData();
                this.emitEvent({ data: res, event: 'click-component-callback' })
              }
            })
          }
          break
      }
    }
  }
  ngOnInit() {
    if (!this.config) {
      this._config = this.dashboardService.routeData.params;
    }
    this.route.params.pipe(takeUntil(this.$destroy)).subscribe(res => {
      if (Object.keys(res).length) {
        this.routeQueryParamsMap = res;
        this.initSetup();
      } else {
        // ##################################################################### //
        //  Just give it one more try to find it from parent context as it could
        //  be a child route :-) e.g. Deparment main and its child scenario  //
        // ##################################################################### //
        this.route.parent.params.pipe(takeUntil(this.$destroy)).subscribe(res => {
          this.routeQueryParamsMap = res;
          this.initSetup();
        });
      }
    })
    if (this.config) {
      if (this.config.onInitCallbackName) {
        this.customTableResolvers[this.config.onInitCallbackName]();
      }
    }

  }
  ngAfterViewInit() {
  }
  ngOnDestroy() {
    this.$destroy.next();
  }

  interpolatePopulateVariableInString(targetObject, value, token) {
    if (value.indexOf(token) == -1) return value;
    value = value.split(token).map((chunk: string) => {
      if (chunk.indexOf("/") == -1) {
        chunk = targetObject[chunk];
      }
      return chunk;
    });
    return value.join('');
  }

  modelChanged: Subject<any> = new Subject<string>();
  changed(text: string, colDef) {
    this.modelChanged.next({ text, colDef });
  }
  // https://stackoverflow.com/questions/32051273/angular-and-debounce

  query;
  getSearchQuery(): string {
    this.query = ``;
    Object.keys(this.model).forEach((key, i) => {
      if (this.model[key].value) {
        this.query += `&${key}=${this.model[key].value}`;
      }
    })
    return this.query;
  }

  onFabClicked(options?: RecursiveAddDialogInterface, valueModel?, callback?) {
    if (this.config && this.config.addButton) {
      switch (this.config.addButton.type) {
        case "link":
          this.router.navigate([this.config.addButton.data]);
          break;
        case "custom-form":
          let dialog = this.dialog.open(CustomFormDialogComponent, { disableClose: true })
          dialog.componentInstance.model = this.config.customForm.model;
          dialog.componentInstance.title = options && options.title ? options.title : this.config.customForm.title;
          dialog.componentInstance.submitUrl = this.config.customForm.submitUrl;
          dialog.componentInstance.formSubmitUrlPostfix = this.formSubmitUrlPostfix || '';
          dialog.componentInstance.alreadyList = this.allRecords;
          try { dialog.componentInstance.validateBeforeSubmit = this.config.customForm.inputConfigs.validateBeforeSubmit; } catch (err) { }
          if (options) {
            if (valueModel) dialog.componentInstance.valueModel = _.cloneDeep(valueModel);
            dialog.componentInstance.addMoreButton = !!(options.addMoreButton);
            if (options.subTitle) dialog.componentInstance.subTitle = options.subTitle;
            if (options.dontShowAgainButtonTxt) dialog.componentInstance.dontShowAgainBtnTxt = options.dontShowAgainButtonTxt;
            if (options.showPropAtTitle) dialog.componentInstance.showPropAtTitle = options.showPropAtTitle;
            if (options.showPoropAtTitlePrefix) dialog.componentInstance.showPoropAtTitlePrefix = options.showPoropAtTitlePrefix;
          }
          dialog.afterClosed().subscribe(res => {

            if ((res && !res.dontShowAgainButtonCalled)) {
              /* ------------------ Assignment/Refresh logic of returned data to model ------------------ */
              if (this.config.addButton.fetchAfterSuccess) {
                this.fetchData();
              } else if (res) {
                if (this.config.addButton.pushAfterAdd) {
                  if (!this.allRecords) this.allRecords = [];
                  this.allRecords.push(res.result);
                  this.setTableDataAfterDataDecided(this.allRecords)
                } else if (this.config.addButton.assignAfterSuccess) {
                  if (this.config.responseFieldWithoutPagination) {
                    this.allRecords = res.result[this.config.responseFieldWithoutPagination];
                  } else {
                    this.allRecords = res.result;
                  }
                  this.setTableDataAfterDataDecided(this.allRecords)
                }
              }
              /* ----------------------------------- -- ----------------------------------- */
              this.emitEvent({ event: 'add', data: res });
            }

            if (callback) callback({ event: 'callback', data: res });
            if (res && res.addAnother) {
              this.onFabClicked();
            }
          })
          break;
        case "component":
          let dialog2 = this.dialog.open(DynamicComponentDialogComponent);
          dialog2.componentInstance.component = this.config.addButton.data['component'];
          dialog2.componentInstance.loadComponent();
          if (this.config.addButton.fetchAfterSuccess) {
            dialog2.componentInstance.dialogRef.afterClosed().subscribe(res => {
              if (res) {
                this.fetchData();
              }
            })
          }
          break;
      }
    }
  }
  actionIconClicked(e, icon, row) {
    try { e.stopPropagation() } catch (err) { }

    if (icon.confirmMessage) {
      let dialog = this.dialog.open(CustomFormDialogComponent);
      dialog.componentInstance.title = icon.confirmMessage;
      dialog.componentInstance.dialogRole = 'confirm';
      dialog.afterClosed().subscribe(res => {
        if (res) {
          this.iconClicked(e, icon, row);
        }
      })
    } else {
      this.iconClicked(e, icon, row);
    }

  }
  iconClicked(e, icon, row) {

    if (icon && icon.emitEvent) {
      this.emitEvent({ data: row, event: 'icon', icon });
    }

    if (icon.callbackOnClick)
      this.customTableResolvers[icon.callbackOnClick](e, icon, row, this, this.config)
  }

  filterToggleIconClicked(model, colDef) {
    if (model[colDef].filter) {
      this.dashboardService.focusControl(`filterInput_${colDef}`);
    }
  }

  editRow(e, row) {
    try { e.stopPropagation() } catch (err) { }
    switch (this.config.edit.type) {
      case "link":
        let route = this.config.edit.data.split("~~").map((chunk: string) => {
          if (chunk.indexOf("/") == -1) {
            chunk = row[chunk];
          }
          return chunk;
        });
        let url = route.join('');
        this.router.navigate([url]);
        break;
      case "custom-form":
        let dialog = this.dialog.open(CustomFormDialogComponent, { disableClose: true })
        dialog.componentInstance.model = this.config.customForm.model;
        dialog.componentInstance.title = this.config.customForm.updateTitle;
        dialog.componentInstance.alreadyList = this.allRecords;
        dialog.componentInstance.saveBtnTxt = "Update";
        dialog.componentInstance.valueModel = _.cloneDeep(row);
        dialog.componentInstance.updateMode = true;
        dialog.componentInstance.submitUrl = `${this.config.customForm.submitUrl}/${DotfieldPipe.dottedField(row, this.config.primaryKey)}`;
        try { dialog.componentInstance.validateBeforeSubmit = this.config.customForm.inputConfigs.validateBeforeSubmit; } catch (err) { }
        dialog.afterClosed().subscribe(res => {
          if (res) {
            if (this.config.edit.fetchAfterSuccess) {
              this.fetchData({ ignoreSpinner: true });
            } else if (this.config.edit.assignAfterSuccess) {
              if (this.config.responseFieldWithoutPagination) {
                this.allRecords = res.result[this.config.responseFieldWithoutPagination];
              } else {
                this.allRecords = res.result;
              }
              this.setTableDataAfterDataDecided(this.allRecords)
            } else {
              if (res.result && res.result._id) {
                let index = this.allRecords.findIndex(r => DotfieldPipe.dottedField(r, this.config.primaryKey) == DotfieldPipe.dottedField(res.result, this.config.primaryKey));
                this.allRecords[index] = res.result;
              } else {
                let index = this.allRecords.findIndex(r => DotfieldPipe.dottedField(r, this.config.primaryKey) == DotfieldPipe.dottedField(res, this.config.primaryKey));
                this.allRecords[index] = res.valueModel;
              }
              this.setTableDataAfterDataDecided(this.allRecords)
            }
            this.emitEvent({ event: 'update', data: row })
          }
        })
        break;
      case "just-emit-event":
        this.emitEvent({ event: 'update', data: row });
        break

    }
  }

  emitEvent(ob: CustomTableEvents) {
    if (this.config && this.config.callbackOnNativeActions) {
      this.customTableResolvers[this.config.callbackOnNativeActions](ob, this);
    }
    this.events.emit(ob);
  }

  deleteRow(e, row) {
    try { e.stopPropagation() } catch (err) { }
    if (this.config.delete.confirm) {
      let dialog = this.dialog.open(CustomFormDialogComponent);
      dialog.componentInstance.dialogRole = 'confirm';
      dialog.componentInstance.title = this.config.delete.confirmMessage || `Are you sure you want to remove this record?`;
      dialog.afterClosed().subscribe(res => {
        if (res) {
          this.deleteRowConfirmed(row);
        }
      })
      return;
    }
    this.deleteRowConfirmed(row);
  }
  deleteRowConfirmed(row) {
    this.authService.delete(`${(this.config.url || this.config.delete.urlPrefixOverride)}/${DotfieldPipe.dottedField(row, this.config.primaryKey)}`, { ignoreToast: true }).subscribe(res => {
      this.toastr.success(this.config.delete.deleteSuccessMessage || `The record has been deleted successfully!`);
      _.remove(this.allRecords, row);
      this.filterAndSetTable();
      this.emitEvent({ data: res, event: 'delete' });
    }, err => {
      this.showInfoDialog(err.error.message, err.error.message2, 'error');
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

  getParamUrl() {
    let url: string = this.config.url;
    return this.interpolatePopulateVariableInString(this.routeQueryParamsMap, url, "~~");
  }

  onUrlCheckboxChanged(queryCheckbox: CutomTableUrlCheckbox) {
    try {
      if (queryCheckbox.value) {
        if (queryCheckbox && queryCheckbox.resetCheckboxesParamFields && queryCheckbox.resetCheckboxesParamFields.length) {
          this.config.urlCheckboxs.forEach(cb => {
            if (queryCheckbox.resetCheckboxesParamFields.includes(cb.paramField)) {
              cb.value = false;
            }
          })
        }
      }
    } catch (err) {

    }
    this.fetchData();
  }

  compareObjects(o1, o2) {
    try {
      let a = o1;
      if (typeof o1 == "object") a = a._id;
      let b = o2;
      if (typeof o2 == "object") b = b._id;
      return a == b;
    } catch (err) {
      return false;
    }
  }

  /* -------------------------- Bulk csv uploader code -------------------------- */
  openCsvUploaderDialog() {
    let csvUploaderConfig: CsvUploaderInterface = {
      formScheme: [],
      title: `${this.config.customForm.title} (Bulk CSV)`,
      saveBtnText: `Upload Csv`,
      submitUrl: this.config.customForm.bulk.submitUrl
    };
    this.config.customForm.model.forEach(model => {
      csvUploaderConfig.formScheme.push({
        title: model.placeholder,
        key: model.name,
        required: true
      });
    })

    let dialog = this.dialog.open(CsvUploaderComponent);
    dialog.componentInstance.config = csvUploaderConfig;
    dialog.afterClosed().subscribe(res => {
      if (res) {
        this.emitEvent({ data: res, event: 'bulk-add' })
        this.paginator.firstPage(); this.fetchData();
        try { this.toastr.info(res.message); } catch (err) { }
      }
    })
  }
  /* -------------------------- ---------------------- -------------------------- */

  /* -------------------------- Tracktor Feature :-D -------------------------- */
  //must call with index as 0
  recursiveDialogOpen(allRecords: any[], index: number, options: RecursiveAddDialogInterface) {

    let data = allRecords[index];
    this.onFabClicked({
      addMoreButton: false,
      subTitle: options.subTitle,
      dontShowAgainButtonTxt: options.dontShowAgainButtonTxt,
      title: options.title,
      showPoropAtTitlePrefix: options.showPoropAtTitlePrefix || '',
      showPropAtTitle: options.showPropAtTitle || ''
    }, data, (res => {
      if (!(res && res.data && res.data.dontShowAgainButtonCalled)) {
        index++;
        if (index < allRecords.length) {
          this.recursiveDialogOpen(allRecords, index, options);
        }
      }
    }))

  }

  randomizeNgxSpinnerType() {
    this.spinnerType = NgxSpinnerTypes[Math.floor(Math.random() * NgxSpinnerTypes.length) + 1];
  }

}


export interface RecursiveAddDialogInterface {
  title?: any,
  addMoreButton: boolean,
  subTitle: string,
  dontShowAgainButtonTxt: string

  showPropAtTitle: string;
  showPoropAtTitlePrefix: string;
}