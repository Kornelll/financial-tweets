import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar, MatDialog, MatOption, MatAutocompleteTrigger, MatAutocompleteSelectedEvent } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { AuthService } from 'src/app/services';
import * as _ from 'lodash';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.css']
})
export class AutocompleteComponent implements OnInit, OnDestroy {

  inpCtrl: FormControl;
  subscription: Subscription;

  @ViewChild('inputControl', { static: false }) inputControl;
  @ViewChild('matInputAuto', { static: false }) matInputAuto;

  @Input() placeholder: string; // Placeholder
  @Input() url: string; // source Url
  @Input() showProp: string; // Property of record to display
  @Input() showProp2: string; // (Optional) Second property of record to display
  @Input() showProp2Prefix = ''
  @Input() outputProp: string; // Property to uniquely identify selected record
  @Input() responseProp: string; // (Optional) if records are present in some specific property of response
  @Input() value: any; // for setting initial value
  @Input() resetOnSelect: boolean; // refresh on select
  @Input() dataSource: {}[];
  @Input() icons = [];
  @Input() debounce: number = 700;
  @Input() showTooltip = false;
  @Input() tickProp;
  @Input() loseFocusOnSelect = false;
  @Input() label;
  @Input() keepOpen = true;
  @Input() preseveNullResponse = true;
  @Input() appearance = 'standard';
  @Input() floatLabel;
  @Input() hint = '';
  @Input() emitOnBlur = true;
  @Input() emitOnReset = false;
  @Input() clearIcon = false;
  @Input() ignoreLogout = false;

  @Input() model: any;
  @Input() modelBindProp: string;
  @Input() selectedBindProp: string;

  @Input() cacheUrl = false;

  setHint(hints) {
    this.hint = hints;
  }
  clearHint() {
    this.hint = '';
  }

  @Input() required: string = '';

  _excludeIds = [];
  @Input() set excludeIds(excludeIds) {
    this._excludeIds = excludeIds;
    if(excludeIds && excludeIds.length) {
      this.applyFilter('');
    }
  }
  get excludeIds() {
    return this._excludeIds;
  }


  _selectedValue: any;
  @Input() set selectedValue(selectedValue) {

    setTimeout(() => {
      this._selectedValue = selectedValue;
      try { selectedValue = _.cloneDeep(selectedValue) } catch (err) { }
      this.setselectedValue(selectedValue, { emittedWhenInput: true });
    });
  }
  get selectedValue() {
    return this._selectedValue;
  }

  _disabled = false;
  @Input() set disabled(disabled) {
    this._disabled = disabled;
    if (disabled) {
      this.inpCtrl.disable();
    } else {
      this.inpCtrl.enable();
    }
  }
  get disabled() {
    return this._disabled;
  }

  _selectFirstOnStart = false;
  @Input() set selectFirstOnStart(selectFirstOnStart) {
    this._selectFirstOnStart = selectFirstOnStart;
    if (this.selectFirstOnStart) {
      this.applyFilter('');
    }
  }
  get selectFirstOnStart() {
    return this._selectFirstOnStart;
  }

  nullResponse;

  @Output() selected = new EventEmitter();
  @Output() iconClick = new EventEmitter();
  records: any;
  @Output() activeOption = new EventEmitter();
  @ViewChild(MatAutocompleteTrigger, { static: false }) trigger: MatAutocompleteTrigger;
  currentOption: MatOption | null;

  randomId: string;

  constructor(
    public _auth: AuthService,
    public dialog: MatDialog,
    public toastr: ToastrService,
    public cd: ChangeDetectorRef
  ) {
    this.randomId = this.makeRandom(20);
    this.inpCtrl = new FormControl();
    this.inpCtrl.valueChanges.pipe(
      debounceTime(this.debounce),
      distinctUntilChanged()
    ).subscribe(value => {
      if (this.selectedValue && !value) {
        this.selectedValue = null;
      }
      this.applyFilter(value)
    });
    this.initScrollListener();
  }

  ngOnInit() {
    // this.setselectedValue();
  }

  ngAfterViewInit() {
    this.subscription = this.trigger.panelClosingActions
      .subscribe((e) => {
        if (!(e && e.source) && typeof this.inpCtrl.value !== 'object') {
          this.inpCtrl.setValue(null);
          this.trigger.closePanel();
        }
      });
  }

  ngOnDestroy(): void {
    try { this.subscription.unsubscribe(); } catch (e) { }
  }

  setselectedValue(defVal?, options?: AutocompleteResponseOptionsInterface) {
    if (defVal) {
      this._selectedValue = defVal;
    }
    if (this.selectedValue && this.selectedValue[this.showProp]) {
      this.inpCtrl.setValue(this.selectedValue);
      if (!options || !options.dontEmit) {
        // this.initProjectActiveOption(options);
      }
    }
  }
  resetValue(openPanelAfterMs?: number, focus?: boolean) {
    this.inpCtrl.setValue('');
    this.value = null;
    // ====================================================== //
    //  this assignment means @Input() set selectedValue will be called too .. (could be changed in future if needed)  //
    this._selectedValue = {};
    // ====================================================== //
    if (openPanelAfterMs) {
      setTimeout(() => {
        if (focus) {
          this.focusMe()
        }
        this.trigger.openPanel();
      }, openPanelAfterMs);
    }
    if (this.emitOnReset) {
      this.selected.emit(null);
    }
  }

  @Input() submitted = false;
  subscriber;
  applyFilter(value: string) {
    if (typeof value === "object") {
      return;
    }
    try {
      if (this.value + '' == value[this.outputProp]) {
        return;
      }
      this.records = [];
    } catch (err) { }
    //-- dataSource
    if (this.dataSource) {
      this.records = this.dataSource.filter(record => {
        for (let prop in record) {
          if (record[prop] && (!(this.excludeIds && this.excludeIds.length) || !this.excludeIds.includes(record["_id"])))
            if (record[prop].toString().toLowerCase().indexOf(value && value.toString().toLowerCase()) !== -1)
              return true;
        }
        return false;
      });
    } else {
      //-- call
      this.toastr.clear();

      if (this.preseveNullResponse && this.nullResponse && this.nullResponse.length && !value) {
        this.records = JSON.parse(JSON.stringify(this.nullResponse));
        return;
      }

      if (!this.url) return;

      this.submitted = true;
      if (this.subscriber) {
        this.subscriber.unsubscribe();
      }

      this.subscriber = this._auth.get(this.url + value, { ignoreLogout: this.ignoreLogout, fromCache: this.cacheUrl })
        .subscribe(
          //-- RESPONSE
          res => {
            this.submitted = false;
            this.records = this.responseProp ? res[this.responseProp] : res;
            if (this.preseveNullResponse && !this.nullResponse && !value) {
              this.nullResponse = _.cloneDeep(this.records);
            }
            if (this.selectFirstOnStart && this.records && this.records.length) {
              this.selectFirstOnStart = false;//only first time
              this.inpCtrl.setValue(this.records[0]);
              this.emitChanges(this.records[0]);
            }
          },

          //-- ERROR
          err => {
            this.submitted = false;
            // this.snackbar.open(err.message, 'Okay')
            if (err.status == 401 || err.status == 402) {
              this.toastr.error("Looks like session expired! Please login again", 'Please login again');
              // this.loginService.logOut();
            }
          },
          //-- COMPLETION
          () => { }

        );
    }
  }

  onOptionSelected(e: MatAutocompleteSelectedEvent) {
    if (e && e.option && e.option.value) {
      this.emitChanges(e.option.value);
    }
  }

  displayValue(item) {
    //-- return if selected item is empty
    if (!item) return "";

    // //-- setting value if changed
    // if (!this.selectedValue || (this.selectedValue[this.outputProp] != item[this.outputProp])) {
    // }
    // this.emitChanges(item);

    if (this.loseFocusOnSelect) {
      setTimeout(() => {
        this.matInputAuto.nativeElement.blur();
      }, 200);
    }

    //-- displaying null if resetOnSelect option is selected
    if (this.resetOnSelect) {
      return '';
    }
    //-- returning response with displey property 2
    if (this.showProp2)
      return item[this.showProp] + " " + item[this.showProp2];

    //-- returning display property 1 of item
    return item[this.showProp];
  }

  onBlurred() {
    setTimeout(() => {

      if (this.emitOnBlur) {
        this.initProjectActiveOption();
      }
    }, 800);
  }

  emitChanges(item) {
    this.value = item[this.showProp];
    this.bindToModel(item);
    this.selected.emit({ model: item });
  }

  bindToModel(item) {

    if (this.model) {
      console.warn("Binding ....")
      let value = item ? this.selectedBindProp ? item[this.selectedBindProp] : item : null;
      if (this.modelBindProp) {
        this.model[this.modelBindProp] = value;
      } else {
        this.model = value;
      }
    }
  }

  // This event was applied on mat-form-fiend .. dont sure why :-|
  // onClick() {
  //   if (!this.inpCtrl.value)
  //     this.inpCtrl.setValue('');
  //   else if (this.resetOnSelect) {
  //     this.inpCtrl.setValue('');
  //   }
  // }

  focusMe(timeout?) {
    setTimeout(() => {
      this.inputControl.nativeElement.focus();
    }, timeout || 700);
  }

  initProjectActiveOption(options?: AutocompleteResponseOptionsInterface) {
    const currentVal = this.inpCtrl.value;
    if (typeof currentVal === 'object' && currentVal != null) {
      this.value = currentVal[this.showProp];
      this.selected.emit({ model: currentVal, options });
      if (this.model) {
        this.model[this.modelBindProp] = this.selectedBindProp ? currentVal[this.selectedBindProp] : currentVal;
      }
    } else {
      this.value = null;
      this.selected.emit(null);
      if (this.model) this.model[this.modelBindProp] = null;
    }
  }

  inputFocused(matInputAuto) {
    if (this.disabled) {
      matInputAuto.blur();
      return;
    }
    try { matInputAuto.select(); } catch (err) { alert(); }
    // if (this.keepOpen) {
    //   setTimeout(() => {
    //     this.trigger.openPanel();
    //   }, 400)
    // }

    this.applyFilter(this.inpCtrl.value || '');
  }
  forceKeepOpenning(matInputAuto) {
    this.randomId = this.makeRandom(20);
    try {
      if (this.keepOpen && matInputAuto) {
        this.trigger.openPanel();
      }
    } catch (err) { }
  }

  // ##################################################################### //
  //  Fixed bug myself which is in mat-AutocompleteComponent 
  //  https://github.com/angular/components/issues/10079  //
  // ##################################################################### //
  // Setup isScrolling variable
  isScrolling;
  initScrollListener() {
    try {
      // Listen for scroll events
      document.getElementById('main-home-container').addEventListener('scroll', (event) => {
        // Clear our timeout throughout the scroll
        window.clearTimeout(this.isScrolling);
        // Set a timeout to run after scrolling ends
        this.isScrolling = setTimeout(() => {
          // Run the callback
          this.trigger.updatePosition()
        }, 0);

      }, false);
    } catch (err) { }
  }

  makeRandom(lengthOfCode: number) {
    // let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890,./;'[]\=-)(*&^%$#@!~`";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let text = "";
    for (let i = 0; i < lengthOfCode; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

}
export interface AutocompleteResponseInterface {
  model: any;
  options?: AutocompleteResponseOptionsInterface
}
export interface AutocompleteResponseOptionsInterface {
  emittedWhenInput?: boolean,
  dontEmit?: boolean
}