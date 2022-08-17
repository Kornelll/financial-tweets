import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { MatStepper, MatPaginator, MatSort, MatTableDataSource, MatDialogRef } from '@angular/material';
import { Location } from '@angular/common';
import { AuthService } from '@/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


export class CsvUploaderInterface {
	formScheme: {
		key: string,
		title: string,
		required?: boolean
	}[];
	title?: string;
	saveBtnText?: string;
	submitUrl?: string;
}

@Component({
	selector: 'csv-uploader',
	templateUrl: 'csv-uploader.component.html',
	styleUrls: ['./csv-uploader.component.scss']
})
export class CsvUploaderComponent implements OnInit, OnDestroy {

	$destroy = new Subject();
	firstFormGroup: FormGroup;
	secondFormGroup: FormGroup;
	@ViewChild('stepper', { static: true }) stepper: MatStepper;
	@ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
	@ViewChild(MatSort, { static: true }) sort: MatSort;
	@ViewChild('myInput', { static: true }) myInputVariable: ElementRef;

	_config: CsvUploaderInterface;
	@Input() set config(_config) {
		this._config = _config;
		if (_config) {
			this.defaultMap = {};
			this.displayedColumns = ['action'];

			this.secondFormGroup = this._formBuilder.group(
				_config.formScheme.reduce((arr, item) => {
					let key = item.key.trim();
					arr[key] = [key];
					if (item.required) arr[key].push(Validators.required);

					this.defaultMap[key] = key;
					this.displayedColumns.push(key);
					return arr;
				}, {})
			);
			this.secondFormGroup.reset();
		}
	}
	get config() {
		return this._config;
	}

	constructor(
		public _formBuilder: FormBuilder,
		public toastr: ToastrService,
		public router: Router,
		public http: HttpClient,
		public dialogRef: MatDialogRef<CsvUploaderComponent>,
		private location: Location,
		private authSvc: AuthService
	) { }

	// form2Schema = {
	// 	name: ['name', Validators.required],
	// 	email: ['email', Validators.required],
	// 	phone: ['phone', Validators.required],
	// 	designation: ['designation', Validators.required]
	// };
	defaultMap: any = {
		// name: 'name',
		// email: 'email',
		// phone: 'phone',
		// designation: 'designation',
	};
	ngOnInit() {
		this.firstFormGroup = this._formBuilder.group({
			firstCtrl: ['roster-csv', Validators.required],
			goodToGo: ['', Validators.required]
		});
		// this.secondFormGroup = this._formBuilder.group(this.form2Schema);
		this.resetStepper();
	}
	ngOnDestroy() {
		this.$destroy.next();
	}
	resetStepper() {
		if (this.stepper && this.stepper.selectedIndex > 0) {
			this.stepper.reset();
		}
		setTimeout(() => {
			this.firstFormGroup.setValue({ firstCtrl: 'roster-csv', goodToGo: '' });
			this.myInputVariable.nativeElement.value = "";
			this.secondFormGroup.setValue(this.defaultMap);
		}, 0);

	}
	onOrgSelect($event) {
		if ($event) {
			this.resetStepper();
		}
	}
	importOption(optionNo) {
		this.firstFormGroup.get('firstCtrl').setValue(optionNo);
	}

	csvHeader = [];
	csvData = [];
	bindMap = {

	};
	onFileLoad(fileLoadedEvent) {
		this.csvData = [];
		const textFromFileLoaded = fileLoadedEvent.target.result;
		let csvContent = textFromFileLoaded;

		let rows = csvContent.split("\n");
		for (let i = 0; i < rows.length; i++) {
			try {
				let cols = rows[i].split(",");
				if (i == 0) {
					this.csvHeader = cols.reduce((arr, item) => {
						if (item) {
							arr.push(item.trim()/*.toLowerCase()*/)
						}
						return arr;
					}, []);
				} else {
					let ob = {};
					cols.forEach((col, i) => {
						if (this.csvHeader[i] && col && col.trim()) {
							col = col.replace(/\"/g, '');
							ob[this.csvHeader[i]/*.toLowerCase()*/] = col;
						}
					})
					this.csvData.push(ob);
				}
			} catch (err) { }
		}
		this.firstFormGroup.get('goodToGo').setValue(true);
		this.stepper.next();
		console.log(this.csvData);
	}
	onFileSelect(input: HTMLInputElement) {

		const files = input.files;
		// var content = this.csvContent;
		this.toastr.clear();
		if (files && files.length) {
			if (!['text/csv', 'application/vnd.ms-excel'].includes(files[0].type)) {
				this.toastr.error("Please select valid .csv file", "Invalid file");
				input.value = '';
				return;
			}
			/*
			 console.log("Filename: " + files[0].name);
			 console.log("Size: " + files[0].size + " bytes");
			 */

			const fileToRead = files[0];

			const fileReader = new FileReader();
			fileReader.onload = this.onFileLoad.bind(this);

			fileReader.readAsText(fileToRead, "UTF-8");
		}

	}
	mappedData = [];
	dataSource: any;
	displayedColumns = [/*'action', 'name', 'email', 'phone', 'designation'*/];
	onStepperChange(ev) {
		if (ev.selectedIndex == 2 && this.firstFormGroup.value.firstCtrl == 'roster-csv') {
			this.mapFinalData();
		}
	}
	colsBindedMap = {};
	mapFinalData() {
		this.mappedData = [];
		let colsBinded = [];
		this.config.formScheme.forEach(fs => {
			let k = fs.key.trim();
			let value = this.secondFormGroup.value[k];
			this.colsBindedMap[k] = value;
			colsBinded.push({ key: k, value });
		})

		this.csvData.forEach(row => {
			let obj: any = {};
			colsBinded.forEach(col => {
				if (row[col.value]) {
					obj[col.key] = row[col.value].trim();
				}
			})
			this.mappedData.push(obj);
		})
		this.setTableData();

	}
	setTableData() {
		this.dataSource = new MatTableDataSource(this.mappedData);
		setTimeout(() => {
			this.dataSource.sort = this.sort;
		}, 0);
	}

	disardRow(element) {
		let index = this.mappedData.findIndex(i => i == element);
		if (index > -1) {
			this.mappedData.splice(index, 1);
			this.setTableData();
		}
	}

	navigateBack() {
		if (this.dialogRef) {
			this.dialogRef.close();
		} else {
			this.location.back();
		}
	}

	uploading = false;
	saveRosters() {
		this.uploading = true;
		this.authSvc.post(this.config.submitUrl, this.mappedData).pipe(takeUntil(this.$destroy))
			.subscribe(res => {
				if (this.dialogRef) {
					this.dialogRef.close(res);
				}
			}).add(() => {
				this.uploading = false;
			})
	}

	downloadSampleFile(): void {
		let data = this.displayedColumns.slice(1).map(c => c.trim()).join(",");
		const blob = new Blob([data], { type: 'text/json; charset=utf-8' });
		let filename = `sample-csv-${this.config.title}-${new Date().getTime()}.csv`;
		let elem = window.document.createElement('a');
		elem.href = window.URL.createObjectURL(blob);
		elem.download = filename;
		document.body.appendChild(elem);
		elem.click();

	}

}