import { Routes } from '@angular/router';
import { LoginComponent, HomeComponent, DashboardComponent, FeedComponent } from './app/modules/app/components';
import { CanActivateViaAuthGuard } from './app/services';

export const appRoutes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: LoginComponent
    },
    {
        path: 'forgot-password',
        component: LoginComponent
    },
    {
        path: 'reset-password',
        component: LoginComponent
    },
    {
        path: 'activate-account',
        component: LoginComponent
    },
    {
        path: 'feed',
        component: HomeComponent,
        children: [
            {
                path: '',
                component: FeedComponent,
                data: {
                    section: 'feed',
                    module: 'feed',
                    hideSideNav: true
                }
            }]
    },
    {
        path: '', component: HomeComponent,
        canActivate: [CanActivateViaAuthGuard],
        data: {
            title: 'App',
        },
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: {
                    title: 'Dashboard',
                    section: 'home',
                    breads: [{ title: 'dashboard' }],
                    hideHomeIcon: true
                }
            },
            {
                path: 'users',
                loadChildren: './modules/users-module/users.module#UsersModule',
                canActivate: [CanActivateViaAuthGuard],
            },
            {
                path: 'configurations',
                loadChildren: './modules/configurations-module/configurations.module#ConfigurationsModule',
                canActivate: [CanActivateViaAuthGuard],
            },
            {
                path: 'companies',
                loadChildren: './modules/companies-module/companies.module#CompaniesModule',
                canActivate: [CanActivateViaAuthGuard],
            },
            {
                path: 'tweets',
                loadChildren: './modules/tweets-module/tweets.module#TweetsModule',
                canActivate: [CanActivateViaAuthGuard],
            },
            { path: '', redirectTo: '/login', pathMatch: 'full' },
            {
                path: '**', redirectTo: '/login'
            }
        ]
    }
];

