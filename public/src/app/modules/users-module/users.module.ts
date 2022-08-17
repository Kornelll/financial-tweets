import { NgModule } from '@angular/core';
import { routedComponents, UsersRoutingModule } from './users-routing.module';
import { SharedModule } from '../shared-module/shared.module';
import { ImageCropperModule } from 'ngx-image-cropper';

@NgModule({
    imports: [
        UsersRoutingModule,
        SharedModule,
        ImageCropperModule,
    ], 
    exports:[routedComponents, ImageCropperModule],
    
    entryComponents: [
        
    ],
    providers: [
    ],
    declarations: [
        routedComponents,
    ]
})
export class UsersModule { }
