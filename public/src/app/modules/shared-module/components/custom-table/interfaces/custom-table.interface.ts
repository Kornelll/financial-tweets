import { CustomFormModel } from '@/components/shared';
import { AclInterface } from '@/directives';

export interface CustomTableConfig {
    ////////////////////////////////////////////////////////////////////////////////////
    // - Title to diaplay
    title?: string,
    subTitle?: string,
    ////////////////////////////////////////////////////////////////////////////////////
    customForm?: {
        title: string, updateTitle: string, submitUrl: string, model: CustomFormModel[],
        inputConfigs?: {
            validateBeforeSubmit?: boolean
        },
        bulk?: {
            submitUrl: string,
            enabled: boolean
        }
    },
    /* Columns to display in table ..
    name: Name of field
    title: Title of field in table
    value: for search query
    disableFilter: Whether to filter the field or not
    */
    tableModel: {
        // TODO. 
        [key: string]: {
            name: string,
            title: string,
            value?: string,
            filter?: boolean,
            inputDisabled?: boolean,
            disableFilter?: boolean,
            trueTitle?: string,
            falseTitle?: string,
            static?: string,
            projection?: '' | 'text' | 'boolean' | 'color' | 'array' | 'target__blank' | 'dateOnly' | 'datetime' | 'image' | 'htmlViewerToggle' | 'showFields' | 'serial' | 'timer',
            timeupLabel?: string,
            showFields?: string[],
            showFieldsSaperator?: string,
            itemSaperator?: string,

            ifField?: string,
            ifFieldPresent?: boolean
        },
    },
    // whether show checkboxes or not for every row
    bulkOps?: boolean,
    // OPTIONAL: boolean -> search by api using field name as query param , boolean: serach locally by field name magically
    apiSearch: boolean,
    customSearch?: {
        placeholder: string,
        apiSearch?: boolean,
        apiQueryField?: string,
    },
    urlCheckboxs?: CutomTableUrlCheckbox[],
    ////////////////////////////////////////////////////////////////////////////////////
    /* OPTIONAL: if not present then page will not contain add fab button
    type: link | custom-form
    data: link of page | custom-form model
    */
    addButton?: {
        position?: 'fab' | 'inline',
        type: 'link' | 'custom-form' | 'component',
        data?: { component: any } | string,
        tooltip: string, fetchAfterSuccess?: boolean,
        pushAfterAdd?: boolean,
        assignAfterSuccess?: boolean,
        title?: string,
        icon?: string,
        permissions?: AclInterface,
        hide?: boolean
    },
    ////////////////////////////////////////////////////////////////////////////////////
    // Link to hit to fetch data
    url?: string,
    urlQuery?: string,
    urlOptions?: any,
    // Primary key .. usable field for edit, delete and primaryKey related operations
    primaryKey?: string,
    // OPTIONAL: which field of response contains data
    /*
    perPageField: name of field which contains per-page data (should be same for request and response)
    pageField: name of current page field for request
    countField: name of response field which contains total number of records
    perPage: Number: to specify what no of records request
    */
    pagination?: {
        perPageField: string,
        pageField: string,
        countField: string,
        responseField: string,
        perPage: number
    },
    responseFieldWithoutPagination?: string,//if pagination is not applied neither is array is being returned ,, instead an object having a field as an array
    ////////////////////////////////////////////////////////////////////////////////////
    /*
    OPTIONAL: specify name of the callback function (static) defined in custom-table.resolver.ts
    It will be called right response data is fetched and before showing in the table
    */
    callbackOnResponse?: string,//provide this name as static method in custom-table.resolver.ts .. and it will work like magic ;-)
    ////////////////////////////////////////////////////////////////////////////////////
    /*OPTIONAL: Whether allow edit/delete for each record
    type: link | custom-form
    data: link of page | custom-form model
    confirm: whether confirm (yes/no) before deleting the record
    ~~field~~: variable interpolation .. e.g. /users/edit/~~_id~~/ will be interpolated as /users/edit/5c2611cb68c7f600111aacba/ where 5c2611cb68c7f600111aacba is the _id of the current clicked record for edit
    */
    edit?: {
        enabled: boolean,
        type: 'link' | 'custom-form' | 'just-emit-event',
        data?: string,
        tooltip: string,
        fetchAfterSuccess?: boolean,
        assignAfterSuccess?: boolean,
        permissions?: AclInterface
    },
    delete?: {
        enabled: boolean,
        confirm: boolean,
        tooltip: string,
        confirmMessage?: string,
        deleteSuccessMessage?: string,
        permissions?: AclInterface,
        urlPrefixOverride?: string
    },
    readonlyPermissions?: AclInterface
    ////////////////////////////////////////////////////////////////////////////////////
    rowClicked?: { type: 'link' | 'component', data: { component: any, rowToModelBindField: string } | any, fetchAfterSuccess?: boolean },
    ////////////////////////////////////////////////////////////////////////////////////
    onInitCallbackName?: string,

    icons?: TableIconsInterface[],

    // If you want to provide local data rather than api .. apiSearch flag should be false
    allRecordsLocal?: any,

    callbackOnNativeActions?: string,

    selectFilters?: SelectFilter[];
    // selectFilter2?: SelectFilter;
};

export interface SelectFilter {
    name: string,
    url?: string,
    urlQuery?: string,
    urlOptions?: any,
    bindField?: string,
    showField?: string,
    showField2?: string,
    showField3?: string,
    placeholder: string,
    responseField?: string,
    multiple?: boolean,
    selectSuffix?: string,
    valueModel?: string,
    required?: boolean,
    disabled?: boolean,
    externalData?: any[],
    hint?: string,
    tooltip?: string,
    hasNone?: boolean

}

export interface CutomTableUrlCheckbox {
    type: 'static' | '',
    title: string,
    paramField: string,
    value?: boolean,
    resetCheckboxesParamFields?: string[]
}

export interface TableIconsInterface {
    icon: string,
    tooltip: string,
    title?: string,
    callbackOnClick: string,
    confirmMessage: string,
    url?: string,
    emitEvent?: boolean,
    permissions?: { app: { codes: string[], logic?: 'and' | 'or' } },
    ifField?: string,
    ifFieldPresent?: boolean,
    data?: any
}