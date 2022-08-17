import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
	selector: 'image-cropper-dialog',
	templateUrl: 'image-cropper-dialog.component.html',
	styleUrls: ['./image-cropper-dialog.component.css']
})

export class ImageCropperDialogComponent implements OnInit {
	@Input() resizeToWidth = 100;
	@Input() maintainAspectRatio = true;
	@Input() roundCropper = false;
	@Input() aspectRatio = 1/1;
	@Input() preview = true;
	@ViewChild('inputFile1', { read: ElementRef, static: false }) inputFile1;
	constructor(
		public dialogRef: MatDialogRef<ImageCropperDialogComponent>
	) {
	}
	ngOnInit() {
		// this.inputFile1.nativeElement.click();
	}
	ngAfterViewInit() {
		this.inputFile1.nativeElement.click();
	}

	imageChangedEvent: any = '';
	croppedImage: any = '';

	fileChangeEvent(event: any): void {
		this.imageChangedEvent = event;
	}
	imageCropped(image: ImageCroppedEvent) {
		this.croppedImage = image.base64;
	}
	imageLoaded() {
		// show cropper
		this.err = "";
	}
	err;
	loadImageFailed() {
		this.err = "Please select valid image file";
		this.croppedImage = "";
	}
	cancel() {
		this.dialogRef.close();
	}
	done() {
		this.dialogRef.close({ base64: this.croppedImage, file: this.imageChangedEvent.target.files[0] });
	}
}
