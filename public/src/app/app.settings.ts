import { environment } from 'src/environments/environment';

export class AppSettings {
    public static get PWD_SECRET(): string {
        return 'uos-complaint-ms';
    }
    public static get API_ENDPOINT(): string {
        return environment.apiUrl;
    }

    public static get VAPID_PUBLIC() {
        return `BJijYMqvbKAAOWITtsy_rxwH8_WXiwG3U1OA8hBusf-9ip_Z9wIYehjyAuzi_eTjoxxkM4jm45zoMgoNOkKEkE0`;
    }

    public static get BASE_URL(): string {
        return environment.baseUrl;
    }

    public static get SOCKET_IO_URL(): string {
        return environment.socketIOUrl;
    }

    public static get SITE_KEY_RECAPTCHA(): string {
        return '6LcTFr4UAAAAAPj9-GuRyXaCLdSlM7qzwGyUzQJq';
    }

    public static get PERMISSIONS() {
        return [
            {
                module: "acl",
                permissions: [
                    { name: "View Configurations", code: "conf_view" },
                    { name: "View ACL", code: "acl_view" },
                    { name: "Add role", code: "role_add" },
                    { name: "Edit role", code: "role_edit" },
                    { name: "Delete role", code: "role_delete" }
                ]
            },
            {
                module: "users",
                permissions: [
                    { name: "View all users", code: "user_view_all" },
                    { name: "View users section", code: "user_view_sec" },
                    { name: "Add users", code: "user_add" },
                    { name: "Bulk Add users", code: "user_add_bulk" },
                    { name: "Edit users", code: "user_edit" },
                    { name: "Delete users", code: "user_delete", tooltip: 'Super permission to delet any user' },
                    { name: "Approve users", code: "user_approve" },
                ]
            },
            {
                module: "release",
                permissions: [
                    { name: "Add release notes", code: "release_add" },
                    { name: "Edit release notes", code: "release_edit" },
                    { name: "Delete release notes", code: "release_delete" }
                ]
            },
            {
                module: "general",
                permissions: [
                    { name: "Manage Companies", code: "manage_companies" },
                    { name: "Manage Tweets", code: "manage_tweets" }
                ]
            },
        ];
    }

    public static get NAV_LISTS() {
        return {
            users: [
                {
                    title: 'Users',
                    routerLink: '/users',
                    activeLinks: ['/users', '/users/edit/:userId', '/users/add'],
                    icon: 'home',
                    checkRouteDataTooToActiveLink: true,
                    permissions: { app: { codes: ['user_view_sec', 'user_view_all'], logic: 'or' }, dpt: { codes: ['member_add', 'member_edit', 'member_delete', 'member_approve'], logic: 'or' } },
                }
                // ,
                // {
                //     title: 'Users Approval',
                //     routerLink: '/users/waiting',
                //     activeLinks: ['/users/waiting'],
                //     icon: 'user-times',
                //     tooltip: `Users waiting for approval`,
                //     permissions: { app: { codes: ['user_view_sec', 'user_view_all'], logic: 'or' }, dpt: { codes: ['member_add', 'member_edit', 'member_delete', 'member_approve'], logic: 'or' } },
                // }
            ],
            configurations: [
                {
                    title: 'Release Notes',
                    routerLink: '/configurations/release-notes',
                    activeLinks: ['/configurations/release-notes'],
                    icon: 'building'
                },
                {
                    title: 'ACL',
                    routerLink: '/configurations/acl',
                    activeLinks: ['/configurations/acl'],
                    icon: 'key',
                    permissions: { app: { codes: ['conf_view'] } }
                }
            ]
        };
    }

}

export const QUILL_EDITOR_CONFIG = {
    modules: {
        toolbar: {
            container: [
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'align': [] }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
                ['link']
            ]
        }
        // imageResize: true
    }
}