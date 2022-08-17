import { NgModule } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeReaderComponent, FormatsDialogComponent } from './components/barcode-reader/barcode-reader.component';
import { SharedModule } from '../shared-module/shared.module';


@NgModule({
    declarations: [
        BarcodeReaderComponent,
        FormatsDialogComponent
    ],
    exports: [
        BarcodeReaderComponent,
    ],
    imports: [
        ZXingScannerModule,
        SharedModule
    ],
    entryComponents: [FormatsDialogComponent]
})
export class BarCodeReaderModule { }


/**  Copyright 2019 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */