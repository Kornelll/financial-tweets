import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanActivateViaAuthGuard } from '@/services';
import { COMPANIES_PARAMS } from '@/table-params';
import { CustomTableComponent } from '@/components/shared';


const routes: Routes = [

    {
        path: 'crud', component: CustomTableComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            section: 'companies',
            module: 'companies',
            title: '',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Companies' }],
            permissions: { app: { codes: ['manage_companies'] } },
            params: COMPANIES_PARAMS,
            hideSideNav: true
        }
    },
    { path: '', redirectTo: '/companies/crud', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class CompaniesRoutingModule { }

export const routedComponents = [
    
];
