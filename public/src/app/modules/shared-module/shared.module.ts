import { NgModule, Renderer } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../material.module';
import { RoleDirective, DynamicDirective, UpperCaseTextDirective } from '@/directives';
import {
      CustomFormDialogComponent,
      ImageCropperDialogComponent,
      CustomTableComponent,
      AutocompleteComponent,
      DynamicComponentDialogComponent,
      TagComponent,
      UploadDocumentsComponent,
      AutoChipsComponent,
      SmdFabSpeedDialComponent, SmdFabSpeedDialActions, SmdFabSpeedDialTrigger,
} from './components';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgxMaskModule } from 'ngx-mask'
import { NgxTrimDirectiveModule } from 'ngx-trim-directive';
import { DotfieldPipe, SafeHtml, DateAgoPipe, ShowFieldsPipe } from 'src/app/pipes';
import { QuillModule } from 'ngx-quill'
import * as Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
Quill.register('modules/imageResize', ImageResize);
import { QUILL_EDITOR_CONFIG } from '@/settings';
import { MatTooltipDefaultOptions, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material';
import { FileUploadModule } from 'ng2-file-upload';
export const customTooltipDefaults: MatTooltipDefaultOptions = {
      showDelay: 400,
      hideDelay: 100,
      touchendHideDelay: 100
}
import { NgxCsvParserModule } from 'ngx-csv-parser';
import { CsvUploaderComponent } from './components/csv-uploader/csv-uploader.component';

@NgModule({
      imports: [
            CommonModule,
            AngularMaterialModule,
            FormsModule,
            ReactiveFormsModule,
            ImageCropperModule,
            NgxSpinnerModule,
            NgxMaskModule.forRoot(),
            NgxTrimDirectiveModule,

            QuillModule.forRoot(QUILL_EDITOR_CONFIG),
            FileUploadModule,
            NgxCsvParserModule,
      ],
      exports: [
            CommonModule,
            AngularMaterialModule,
            FormsModule,
            ReactiveFormsModule,
            RoleDirective,
            CustomTableComponent,
            ImageCropperModule,
            NgxSpinnerModule,
            NgxMaskModule,
            NgxTrimDirectiveModule,
            DotfieldPipe,
            SafeHtml,
            DateAgoPipe,
            ShowFieldsPipe,
            UpperCaseTextDirective,
            AutocompleteComponent, TagComponent,
            AutoChipsComponent,

            DynamicComponentDialogComponent, UploadDocumentsComponent,
            SmdFabSpeedDialComponent, SmdFabSpeedDialActions, SmdFabSpeedDialTrigger,
            DynamicDirective,

            QuillModule,
            FileUploadModule,
            NgxCsvParserModule,
      ],
      declarations: [
            RoleDirective,
            CustomFormDialogComponent,
            ImageCropperDialogComponent,
            CustomTableComponent,
            DotfieldPipe,
            SafeHtml,
            DateAgoPipe,
            ShowFieldsPipe,
            UpperCaseTextDirective,
            AutocompleteComponent,

            DynamicComponentDialogComponent,
            DynamicDirective,
            AutoChipsComponent,

            TagComponent,

            UploadDocumentsComponent,
            SmdFabSpeedDialComponent, SmdFabSpeedDialActions, SmdFabSpeedDialTrigger,
            CsvUploaderComponent
      ],
      providers: [{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: customTooltipDefaults }],
      entryComponents: [
            CustomFormDialogComponent,
            ImageCropperDialogComponent,
            DynamicComponentDialogComponent,
            CsvUploaderComponent
      ]
})
export class SharedModule { }
