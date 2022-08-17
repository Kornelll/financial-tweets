import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanActivateViaAuthGuard } from '@/services';
import { TWEETS_PARAMS } from '@/table-params';
import { CustomTableComponent } from '@/components/shared';


const routes: Routes = [

    {
        path: 'crud', component: CustomTableComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            section: 'tweets',
            module: 'tweets',
            title: '',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Tweets' }],
            permissions: { app: { codes: ['manage_tweets'] } },
            params: TWEETS_PARAMS,
            hideSideNav: true
        }
    },
    { path: '', redirectTo: '/tweets/crud', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class TweetsRoutingModule { }

export const routedComponents = [
    
];
