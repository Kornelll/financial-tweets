import { MatChipInputEvent, MatAutocompleteTrigger, MatDialog } from '@angular/material';
import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import { DashboardService } from '@/services';
import { DotfieldPipe } from 'src/app/pipes';
import { CustomFormModel, CustomFormDialogComponent } from '../custom-form-dialog/custom-form-dialog.component';
import { NgxCsvParser } from 'ngx-csv-parser';
import { NgxCSVParserError } from 'ngx-csv-parser';

@Component({
  selector: 'auto-chips',
  templateUrl: 'auto-chips.component.html',
  styleUrls: ['./auto-chips.component.css']
})

export class AutoChipsComponent implements OnInit {

  @Output() added = new EventEmitter();
  @Output() removed = new EventEmitter();
  @ViewChild(MatAutocompleteTrigger, { static: false }) trigger: MatAutocompleteTrigger;
  @ViewChild('csvFile', { static: false }) csvFile: ElementRef;
  _config;
  @Input() set config(config: AutoChipsConfigModel) {
    this._config = config;
    if (config) {
      this.init();
    }
  }
  get config() {
    return this._config;
  }
  ngOnInit() { }
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  inputCtrl = new FormControl();
  filteredOptions: any[] = [];
  showAll = false;

  @ViewChild('chipsInputView', { static: false }) chipsInputView;

  constructor(
    private dialog: MatDialog,
    private dashboardSvc: DashboardService,
    private ngxCsvParser: NgxCsvParser
  ) {
    this.init();
  }

  init() {
    if (this.config) {
      this._filter('');
      this.inputCtrl.valueChanges.subscribe(res => {
        this._filter(res);
      });
    }
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    let value = event.value;
    if (this.patternValidationPassed(value)) {
      let item = this.config.options.find(i => i && i[this.config.showProp].toLowerCase() == value.toLowerCase());

      if (item) {
        this.selected({ option: { value: item } })
      } else {
        if (this.config.addModel) {
          // Add our item
          if ((value || '').trim()) {
            value = value.trim();
            item = {};
            Object.keys(this.config.addModel).forEach(key => {
              item[key] = this.config.addModel[key];
            });
            item[this.config.showProp] = value;
            this.config.selectedOptions.push(item);
            this.config.options.push(Object.create(item));
          }
          this.inputCtrl.setValue(null);
        }
        this.emitAdd(item);
      }
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  selectAll(reset?) {
    this.dashboardSvc.showConfirmDialog(`Are you sure you want to ${reset ? 'rest selection' : 'select all'}?`, '', (res) => {
      if (res) {
        this.config.selectedOptions.length = 0;
        if (reset) {
        } else {
          this.config.options.forEach(o => this.config.selectedOptions.push(o))
          // this.config.selectedOptions
        }
      }
    })
  }

  emitAdd(item) {
    this.added.emit({ item, config: this.config });
  }

  remove(item: string): void {
    if (this.config) {
      const index = this.config.selectedOptions.indexOf(item);

      if (index >= 0) {
        this.config.selectedOptions.splice(index, 1);
        this.removed.emit({ type: 'chips', item });
      }
    }
  }
  patternValidationPassed(value: string): boolean {
    if (!this.config || !this.config.pattern) return true;
    else if (!value) return false;
    let result = (new RegExp(this.config.pattern)).test(value);
    return result;
  }
  selected(event: any): void {
    let item = event.option.value;
    if (this.config && this.patternValidationPassed(item[this.config.showProp])) {
      this.config.selectedOptions.push(item);
      this.emitAdd(item);
      this.chipsInputView.nativeElement.value = '';
    }
    this.inputCtrl.setValue(null);
  }

  _filter(value: any) {
    if (this.config) {
      if (value) {
        this.filteredOptions = (this.config.options || []).filter(item => {
          let found = item && item[this.config.showProp].toLowerCase().indexOf(value) > -1;
          if (found) return true;
          if (this.config.showProp2) found = DotfieldPipe.dottedField(item, this.config.showProp2).toLowerCase().indexOf(value) > -1;
          if (found) return true;
          if (this.config.showProp3) found = DotfieldPipe.dottedField(item, this.config.showProp3).toLowerCase().indexOf(value) > -1;
          if (found) return true;
          return false;
        });
      } else {
        this.filteredOptions = (this.config.options || []).slice();
      }

      this.filteredOptions = _.difference(this.filteredOptions, this.config.selectedOptions);
    }
  }
  removeEmail(item, i) {
    this.removed.emit({ type: 'list', item });
    _.remove(this.config.options, item);
    _.remove(this.filteredOptions, item);
    // let dialog = this.dialog.open(ConfirmDialogComponent);
    // dialog.componentInstance.dialogMessage = this.config.removeConfirmMessage;
    // dialog.componentInstance.dialogNote = item[this.config.showProp];
    // dialog.afterClosed().subscribe(res => {
    // 	if (res) {
    // 	}
    // })
  }
  onFocus(e) {
    this._filter('');
    this.trigger.openPanel();
  }

  loadCustomForm() {
    let dialog = this.dialog.open(CustomFormDialogComponent, { disableClose: true });
    dialog.componentInstance.model = this.config.customForm.model;
    dialog.componentInstance.title = this.config.customForm.title;
    dialog.componentInstance.subTitle = this.config.customForm.subTitle || '';
    dialog.componentInstance.onlyFilledData = true;
    dialog.afterClosed().subscribe((res) => {
      console.log(res);
      if (res) {
        try { this.config.options.push(res); } catch (err) { }
        try { this.config.selectedOptions.push(res); } catch (err) { }
        if (res.addAnother) {
          this.loadCustomForm();
        }
      }
    })

  }

  csvRecords: any[] = [];
  header = true;
  loadImportCsv() {
    this.csvFile.nativeElement.click();
  }
  fileChangeListener($event: any): void {

    // Select the files from the event
    const files = $event.srcElement.files;

    // Parse the file you want to select for the operation along with the configuration
    this.ngxCsvParser.parse(files[0], { header: this.header, delimiter: ',' })
      .pipe().subscribe((result: Array<any>) => {
        this.csvRecords = result;
        if (this.csvRecords && this.csvRecords.length) {
          if (this.csvRecords[0].email && this.csvRecords[0].name && this.csvRecords[0].phone) {
            this.csvRecords.forEach(r => {
              try {
                this.config.options.push(r);
                this.config.selectedOptions.push(r);
              } catch (err) {
              }
            })
          } else {
            this.dashboardSvc.showInfoDialog(`Required headers are missing from the provided csv file`, `headers of csv file must be e.g. name,email,phone`, `error`);
          }
        } else {
          this.dashboardSvc.showInfoDialog(`No records found in the file`, `Please select a valid csv file with headers e.g. name,email,phone`, `error`);
        }
      }, (error: NgxCSVParserError) => {
        console.log('Error', error);
        this.dashboardSvc.showInfoDialog(error.message, `Please select a valid csv file with headers e.g. name,email,phone`, `error`);
      });

  }
}

export class AutoChipsConfigModel {
  showProp = 'name';
  showProp2?: string; showProp2Prefix?: string;
  showProp3?: string; showProp3Prefix?: string;
  bindProp?= 'id';
  addModel: any = {
    email: '',
    is_primary: true,
    type: 'to'
  };
  options?= [];
  selectedOptions?= [];
  prefixLabel?;
  removeConfirmMessage?;
  removeConfirmTooltip?;
  pattern?;
  selectAll?: boolean;
  showMaxChips?: number;
  customForm?: {
    model: CustomFormModel[],
    btnTitle: string,
    title: string,
    subTitle?: string,
    btnTootltip?: string
  };
}
