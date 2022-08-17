import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { BehaviorSubject } from 'rxjs';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSelectionListChange } from '@angular/material';

@Component({
	selector: 'app-barcode-reader',
	templateUrl: 'barcode-reader.component.html',
	styleUrls: ['./barcode-reader.component.scss']
})

export class BarcodeReaderComponent implements OnInit {
	availableDevices: MediaDeviceInfo[];
	currentDevice: MediaDeviceInfo = null;

	formatsEnabled: BarcodeFormat[] = [
		BarcodeFormat.CODE_128,
		BarcodeFormat.DATA_MATRIX,
		BarcodeFormat.EAN_13,
		BarcodeFormat.QR_CODE,
	];

	hasDevices: boolean;
	hasPermission: boolean;

	qrResultString: string;
	qrResultStringPrevious: string;

	config = {
		torchEnabled: false,
		tryHarder: false,
		selectedDeviceId: null
	}

	torchAvailable$ = new BehaviorSubject<boolean>(false);

	@Output() change = new EventEmitter<BarcodeResponse>();

	constructor(
		private _dialog: MatDialog
	) {
	}

	ngOnInit() { }


	clearResult(): void {
		this.qrResultStringPrevious = this.qrResultString;
		this.qrResultString = null;
	}

	onCamerasFound(devices: MediaDeviceInfo[]): void {
		this.availableDevices = devices;
		this.hasDevices = Boolean(devices && devices.length);
		setTimeout(() => {
			this.initConfig();
		}, 0);
	}

	onCodeResult(resultString: string) {
		this.qrResultStringPrevious = this.qrResultString;
		this.qrResultString = resultString;
		if (this.qrResultString != this.qrResultStringPrevious) {
			this.change.emit({ value: this.qrResultString, previous: this.qrResultStringPrevious });
		}
	}

	onDeviceSelectChange(selected: string) {
		this.config.selectedDeviceId = selected;
		const device = this.availableDevices.find(x => x.deviceId === selected);
		this.currentDevice = device || null;
		this.saveConfig();
	}
	saveConfig() {
		localStorage.setItem('__barcode_reader_config', JSON.stringify(this.config));
	}
	initConfig() {
		let initNew = false;
		let item = localStorage.getItem('__barcode_reader_config');
		if (item) {
			try { this.config = JSON.parse(item) } catch (err) { initNew = true; }
		} else {
			initNew = true;
		}
		if(initNew) {
			this.config = {
				tryHarder: false,
				torchEnabled: false,
				selectedDeviceId: null
			}
		}
		if(this.config.selectedDeviceId) {
			this.onDeviceSelectChange(this.config.selectedDeviceId);
		}
	}

	openFormatsDialog() {
		const data = {
			formatsEnabled: this.formatsEnabled,
		};

		this._dialog
			.open(FormatsDialogComponent, { data })
			.afterClosed()
			.subscribe(x => { if (x) { this.formatsEnabled = x; } });
	}

	onHasPermission(has: boolean) {
		this.hasPermission = has;
	}

	onTorchCompatible(isCompatible: boolean): void {
		this.torchAvailable$.next(isCompatible || false);
	}

	toggleTorch(): void {
		this.config.torchEnabled = !this.config.torchEnabled;
	}

	toggleTryHarder(): void {
		this.config.tryHarder = !this.config.tryHarder;
	}
}


////////////////////////////////////////////////////////

@Component({
	selector: 'app-formats-dialog',
	template: `
	<header>
		Available formats:
	</header>

	<mat-selection-list #selectedFormats (selectionChange)="onSelectionChange($event)">
		<mat-list-option *ngFor="let format of formatsAvailable" checkboxPosition="start" [selected]="isEnabled(format)" [value]="format">
			{{ formatNames[format] }}
		</mat-list-option>
	</mat-selection-list>

	<mat-dialog-actions>
		<button mat-flat-button color="primary" (click)="close()">Done</button>
	</mat-dialog-actions>

	`,
	styles: [`mat-dialog-actions {
		justify-content: flex-end;
	  }
	  `]
})
export class FormatsDialogComponent {

	formatsAvailable = formatsAvailable;

	formatsEnabled: BarcodeFormat[];

	readonly formatNames = formatNames;

	constructor(
		@Inject(MAT_DIALOG_DATA) readonly data: any,
		private readonly _dialogRef: MatDialogRef<FormatsDialogComponent>,
	) {
		this.formatsEnabled = data.formatsEnabled || [];
	}

	close() {
		this._dialogRef.close(this.formatsEnabled);
	}

	isEnabled(format: BarcodeFormat) {
		return this.formatsEnabled.find(x => x === format);
	}

	onSelectionChange(event: MatSelectionListChange) {
		this.formatsEnabled = event.source.selectedOptions.selected.map(selected => selected.value);
	}
}

export interface BarcodeResponse {
	value: string;
	previous?: string;
}

export const formatsAvailable = [
	BarcodeFormat.CODE_128,
	BarcodeFormat.DATA_MATRIX,
	BarcodeFormat.EAN_13,
	BarcodeFormat.EAN_8,
	BarcodeFormat.ITF,
	BarcodeFormat.QR_CODE,
	BarcodeFormat.RSS_14,
];

export const formatNames = [
	'Aztec 2D barcode format.',
	'CODABAR 1D format.',
	'Code 39 1D format.',
	'Code 93 1D format.',
	'Code 128 1D format.',
	'Data Matrix 2D barcode format.',
	'EAN-8 1D format.',
	'EAN-13 1D format.',
	'ITF (Interleaved Two of Five) 1D format.',
	'MaxiCode 2D barcode format.',
	'PDF417 format.',
	'QR Code 2D barcode format.',
	'RSS 14',
	'RSS EXPANDED',
	'UPC-A 1D format.',
	'UPC-E 1D format.',
	'UPC/EAN extension format. Not a stand-alone format.',
];