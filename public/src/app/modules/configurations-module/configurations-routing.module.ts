import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanActivateViaAuthGuard } from '@/services';
import { RELEASE_NOTES_PARAMS } from '@/table-params';
import { RolePermissionsComponent } from '@/components/configurations';
import { CustomTableComponent } from '@/components/shared';


const routes: Routes = [

    {
        path: 'acl', component: RolePermissionsComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            section: 'configurations',
            module: 'configurations',
            title: '',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Configurations - ACL' }],
            permissions: { app: { codes: ['conf_view'] } }
        }
    },
    {
        path: 'release-notes', component: CustomTableComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            section: 'release-notes',
            module: 'release-notes',
            title: '',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Release Notes' }],
            params: RELEASE_NOTES_PARAMS,
            hideSideNav: true
        }
    },
    { path: '', redirectTo: '/configurations/acl', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class UsersRoutingModule { }

export const routedComponents = [
    RolePermissionsComponent
];
