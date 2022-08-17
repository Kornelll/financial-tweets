import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanActivateViaAuthGuard } from '@/services';
import { UserAddComponent, UserDetailsComponent } from '@/components/users';
import { CustomTableComponent } from '@/components/shared';
import * as _ from 'lodash';
import { USERS_LIST_PARAMS } from '@/table-params';

const routes: Routes = [

    {
        path: '', component: CustomTableComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            permissions: { app: { codes: ['user_view_sec', 'user_view_all'], logic: 'or' }, dpt: { codes: ['member_add', 'member_edit', 'member_delete', 'member_approve'], logic: 'or' } },
            theme: 'md-grey',
            module: 'users',
            section: 'users',
            title: 'Vteam | Excalibur',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Users' }],
            params: USERS_LIST_PARAMS
        }
    },
    {
        path: 'add', component: UserAddComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            permissions: { app: { codes: ['user_view_sec', 'user_view_all'], logic: 'or' }, dpt: { codes: ['member_add', 'member_edit', 'member_delete', 'member_approve'], logic: 'or' } },
            theme: 'md-grey',
            module: 'users',
            section: 'users',
            title: 'Add User | Excalibur',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Users', link: '/users' }, { title: 'Add User' }]
        }
    },
    {
        path: 'edit/:userId', component: UserAddComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            permissions: { app: { codes: ['user_view_sec', 'user_view_all'], logic: 'or' }, dpt: { codes: ['member_add', 'member_edit', 'member_delete', 'member_approve'], logic: 'or' } },
            theme: 'md-grey',
            module: 'users',
            section: 'users',
            title: 'Edit User | Excalibur',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Users', link: '/users' }, { title: 'Edit User' }],
            navItemActiveLinkInRouteData: '/users/edit/:userId'
        }
    },
    {
        path: 'details/:userId', component: UserDetailsComponent,
        canActivate: [CanActivateViaAuthGuard],
        children: [],
        data: {
            theme: 'md-grey',
            module: 'users',
            section: 'users',
            title: 'Edit User | Excalibur',
            breads: [{ title: 'Dashboard', link: '/dashboard' }, { title: 'Users', link: '/users' }, { title: 'User Details' }],
            navItemActiveLinkInRouteData: '/users/edit/:userId',
            hideSideNav: true
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class UsersRoutingModule { }

export const routedComponents = [
    UserAddComponent, UserDetailsComponent
];
