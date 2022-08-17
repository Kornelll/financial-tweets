import { AppSettings } from '../app.settings';
import * as _ from 'lodash';
import { CustomTableConfig } from '../modules/shared-module/components/custom-table/interfaces/';

// ~~~~~~~~~~~~~ Users Params ~~~~~~~~~~~~ //
export const USERS_LIST_PARAMS: CustomTableConfig = {
    ////////////////////////////////////////////////////////////////////////////////////
    // - Title to diaplay
    title: 'Users',
    ////////////////////////////////////////////////////////////////////////////////////
    /* Columns to display in table ..
    name: Name of field
    title: Title of field in table
    value: for search query
    disableFilter: Whether to filter the field or not
    */
    tableModel: {
        'name': { name: 'name', title: 'Name', value: '', filter: false },
        'email': { name: 'email', title: 'Email', value: '', filter: false },
        'cnic': { name: 'cnic', title: 'CNIC', value: '', filter: false },
        'college.name': { name: 'college.name', title: 'College', value: '', filter: false, disableFilter: true },
        'accountStatus': { name: 'accountStatus', title: 'Account Status', value: '', filter: false, inputDisabled: false }
    },
    // whether show checkboxes or not for every row
    bulkOps: false,
    // OPTIONAL: true -> search by api using field name as query param , false: serach locally by field name magically
    apiSearch: true,
    ////////////////////////////////////////////////////////////////////////////////////
    /* OPTIONAL: if not present then page will not contain add fab button
    type: link | custom-form
    data: link of page | custom-form model
    */
    addButton: { type: 'link', data: '/users/add', tooltip: 'Add New User', permissions: { app: { codes: ['user_view_all', 'user_add'] } } },
    ////////////////////////////////////////////////////////////////////////////////////
    // Link to hit to fetch data
    url: `${AppSettings.API_ENDPOINT}/users`,
    // Primary key .. usable field for edit, delete and primaryKey related operations
    primaryKey: '_id',
    /*
    perPageField: name of field which contains per-page data (should be same for request and response)
    pageField: name of current page field for request
    countField: name of response field which contains total number of records
    perPage: Number: to specify what no of records request
    */
    pagination: {
        perPageField: 'perPage',
        pageField: 'page',
        countField: 'count',
        responseField: 'data',
        perPage: 9
    },
    ////////////////////////////////////////////////////////////////////////////////////
    /*
    OPTIONAL: specify name of the callback function (static) defined in custom-table.resolver.ts
    It will be called right response data is fetched and before showing in the table
    */
    callbackOnResponse: "userApiResResolver",//provide this name as static method in custom-table.resolver.ts .. and it will work like magic ;-)
    ////////////////////////////////////////////////////////////////////////////////////
    /*OPTIONAL: Whether allow edit/delete for each record
    type: link | custom-form
    data: link of page | custom-form model
    confirm: whether confirm (yes/no) before deleting the record
    ~~field~~: variable interpolation .. e.g. /users/edit/~~_id~~/ will be interpolated as /users/edit/5c2611cb68c7f600111aacba/ where 5c2611cb68c7f600111aacba is the _id of the current clicked record for edit
    */
    edit: { enabled: true, type: 'link', data: '/users/edit/~~_id~~/', tooltip: 'Edit User', permissions: { app: { codes: ['user_view_all', 'user_edit'] } } },
    delete: { enabled: true, confirm: true, tooltip: 'Delete User', permissions: { app: { codes: ['user_view_all', 'user_delete'] } } },
    ////////////////////////////////////////////////////////////////////////////////////
    rowClicked: { type: 'link', data: '/users/details/~~_id~~/' }
};


// ====================================================== //
// ============ Project release notes config ============ //
// ====================================================== //
export const RELEASE_NOTES_PARAMS: CustomTableConfig = {
    title: 'Release Notes',
    tableModel: {
        'name': { name: 'name', title: 'Name', value: '', filter: false },
        'version': { name: 'version', title: 'Version', value: '', filter: false },
        'releaseDate': { name: 'releaseDate', title: 'Release Date', disableFilter: true, projection: 'dateOnly' },
        'notes': { name: 'notes', title: 'Release Notes', disableFilter: true, projection: 'htmlViewerToggle' }
    },
    customForm: {
        title: 'Add Release Notes', updateTitle: 'Update Release Notes',
        submitUrl: `${AppSettings.API_ENDPOINT}/release-notes`,
        model: [
            { name: 'name', type: 'text', placeholder: 'Name', required: true, checkDuplicate: true, uniqueKey: '_id', maxlength: 20 },
            { name: 'version', type: 'text', placeholder: 'Version', required: true, checkDuplicate: true, uniqueKey: '_id', maxlength: 20 },
            { name: 'releaseDate', type: 'date', placeholder: 'Release Date', required: true },
            {
                name: 'notes', type: 'quill-editor', placeholder: `Release Notes`, required: true,
                value: `
                <b>Features/Enhancements</b>
                <ul>
                    <li></li>
                </ul>
                <b>Bugs Fixes</b>
                <ul>
                    <li></li>
                </ul>
                <b>UI/UX Improvements</b>
                <ul>
                    <li></li>
                </ul>
                `
            }
        ]
    },
    addButton: {
        tooltip: 'Add Release Notes',
        type: 'custom-form',
        pushAfterAdd: true,
        permissions: { app: { codes: ['release_add'] } }

    },
    delete: {
        confirm: true,
        enabled: true,
        tooltip: `Delete Release Notes`,
        confirmMessage: `Are you sure you want to remove release notes?`,
        permissions: { app: { codes: ['release_delete'] } }
    },
    edit: {
        enabled: true,
        tooltip: `Delete Release Notes`,
        type: 'custom-form',
        assignAfterSuccess: true,
        permissions: { app: { codes: ['release_edit'] } }
    },
    bulkOps: false,
    primaryKey: '_id',
    apiSearch: true,
    url: `${AppSettings.API_ENDPOINT}/release-notes`,
    pagination: {
        perPageField: 'perPage',
        pageField: 'page',
        countField: 'count',
        responseField: 'data',
        perPage: 10,
    }
};

// ====================================================== //
// ============ Companies config ============ //
// ====================================================== //
export const COMPANIES_PARAMS: CustomTableConfig = {
    title: 'Companies',
    tableModel: {
        'name': { name: 'name', title: 'Name', value: '', filter: false },
        'verified': { name: 'verified', title: 'Verified', value: '', filter: false, projection: 'boolean', disableFilter: true }
    },
    customForm: {
        title: 'Add Company', updateTitle: 'Update Company',
        submitUrl: `${AppSettings.API_ENDPOINT}/companies`,
        model: [
            { name: 'name', type: 'text', placeholder: 'Name', required: true, checkDuplicate: true, uniqueKey: '_id', maxlength: 200 },
            { name: 'verified', type: 'checkbox', placeholder: 'Verified' },
        ]
    },
    addButton: {
        tooltip: 'Add Company',
        type: 'custom-form',
        pushAfterAdd: true,
        permissions: { app: { codes: ['manage_companies'] } }

    },
    delete: {
        confirm: true,
        enabled: true,
        tooltip: `Delete Company`,
        confirmMessage: `Are you sure you want to remove Company?`,
        permissions: { app: { codes: ['manage_companies'] } }
    },
    edit: {
        enabled: true,
        tooltip: `Delete Company`,
        type: 'custom-form',
        permissions: { app: { codes: ['manage_companies'] } }
    },
    bulkOps: false,
    primaryKey: '_id',
    apiSearch: true,
    url: `${AppSettings.API_ENDPOINT}/companies`,
    pagination: {
        perPageField: 'perPage',
        pageField: 'page',
        countField: 'count',
        responseField: 'data',
        perPage: 20,
    }
};


// ====================================================== //
// ============ Tweets config ============ //
// ====================================================== //
export const TWEETS_PARAMS: CustomTableConfig = {
    title: 'Tweets',
    
    tableModel: {
        'text': { name: 'name', title: 'Name', value: '', filter: false, projection: 'htmlViewerToggle' },
        'timestamp': { name: 'timestamp', title: 'Datetime', filter: false, projection: 'datetime', disableFilter: true },
        'company.name': { name: 'company.name', title: 'Source', filter: false, disableFilter: true },
        'source': { name: 'source', title: 'Source', value: '', filter: false, disableFilter: true },
        'company.verified': { name: 'company.verified', title: 'Verified', filter: false, projection: 'boolean', disableFilter: true },
        'symbols': { name: 'symbols', title: 'Symbols', value: '', filter: false, disableFilter: true },
        'url': { name: 'url', title: 'URL', value: '', filter: false, disableFilter: true, projection: 'htmlViewerToggle' },
    },
    customForm: {
        title: 'Add Tweet', updateTitle: 'Update Tweet',
        submitUrl: `${AppSettings.API_ENDPOINT}/tweets`,
        model: [
            { name: 'externalId', type: 'hidden', placeholder: 'External ID' },
            { name: 'text', type: 'text', placeholder: 'Name', required: true, checkDuplicate: true, uniqueKey: '_id', maxlength: 1200 },
            { name: 'timestamp', type: 'datetime', placeholder: 'Datetime' },
            { name: 'source', type: 'text', placeholder: 'Source' },
            { name: 'symbols', type: 'text', placeholder: 'Symbols', maxlength: 30 },
            { name: 'company', type: 'select', placeholder: 'Company', url: `${AppSettings.API_ENDPOINT}/companies?ids=all`, showField: 'name', 'bindField': '_id'},
            { name: 'url', type: 'textarea', placeholder: 'URL' },
            { name: 'verified', type: 'hidden', placeholder: 'Verified' },
        ],
        bulk: {
            submitUrl: `${AppSettings.API_ENDPOINT}/tweets/bulk-post`,
            enabled: true
        }
    },
    addButton: {
        tooltip: 'Add Tweet',
        type: 'custom-form',
        pushAfterAdd: true,
        permissions: { app: { codes: ['manage_tweets'] } },
    },
    delete: {
        confirm: true,
        enabled: true,
        tooltip: `Delete Tweet`,
        confirmMessage: `Are you sure you want to remove Tweet?`,
        permissions: { app: { codes: ['manage_tweets'] } }
    },
    edit: {
        enabled: true,
        tooltip: `Delete Tweet`,
        type: 'custom-form',
        permissions: { app: { codes: ['manage_tweets'] } }
    },
    bulkOps: false,
    primaryKey: '_id',
    apiSearch: true,
    url: `${AppSettings.API_ENDPOINT}/tweets`,
    pagination: {
        perPageField: 'perPage',
        pageField: 'page',
        countField: 'count',
        responseField: 'data',
        perPage: 20,
    }
};