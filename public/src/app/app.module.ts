import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './modules/app/components/app/app.component';
import { LoginComponent, HomeComponent, DashboardComponent, NavListComponent } from './modules/app/components';
import { RouterModule } from '@angular/router';

import { appRoutes } from '../routes';
import { SharedModule } from './modules/shared-module/shared.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ToastrModule } from 'ngx-toastr';
import { RecaptchaModule } from 'ng-recaptcha';
import { NoCacheHeadersInterceptor } from './services';
import { FeedComponent } from './modules/app/components/feed/feed.component';


@NgModule({
  declarations: [
    AppComponent, LoginComponent, HomeComponent, DashboardComponent, NavListComponent, FeedComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    RouterModule.forRoot(appRoutes, { useHash: true }),
    HttpClientModule,
    ToastrModule.forRoot(),
    RecaptchaModule,
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: NoCacheHeadersInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
