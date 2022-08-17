import { NgModule } from '@angular/core';
import { routedComponents, CompaniesRoutingModule } from './companies-routing.module';
import { SharedModule } from '../shared-module/shared.module';

@NgModule({
    imports: [
        CompaniesRoutingModule,
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
export class CompaniesModule { }
