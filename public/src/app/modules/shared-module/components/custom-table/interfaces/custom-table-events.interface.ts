import { TableIconsInterface } from ".";

export interface CustomTableEvents {
    event: 'add' | 'update' | 'delete' | 'icon' | 'click-component-callback' | 'api-data-loaded' | 'bulk-add',
    data: any,

    icon?: TableIconsInterface
}