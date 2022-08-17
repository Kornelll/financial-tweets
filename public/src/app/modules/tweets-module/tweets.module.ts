import { NgModule } from '@angular/core';
import { routedComponents, TweetsRoutingModule } from './tweets-routing.module';
import { SharedModule } from '../shared-module/shared.module';

@NgModule({
    imports: [
        TweetsRoutingModule,
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
export class TweetsModule { }
