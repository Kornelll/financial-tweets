import { NgModule } from '@angular/core';
import { routedComponents, UsersRoutingModule } from './configurations-routing.module';
import { SharedModule } from '../shared-module/shared.module';

@NgModule({
    imports: [
        UsersRoutingModule,
        SharedModule
    ], 
    exports:[routedComponents],
    
    entryComponents: [
    ],
    providers: [
    ],
    declarations: [
        routedComponents,
    ]
})
export class ConfigurationsModule { }
