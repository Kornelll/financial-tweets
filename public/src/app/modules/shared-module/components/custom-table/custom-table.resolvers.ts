import { CustomTableComponent } from '@/components/shared';
import * as _ from 'lodash';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CustomTableResolvers {

    constructor(
    ) {
    }

    public userApiResResolver(res) {
        res.forEach(u => {
            try { u.primaryEmail = u.emails.find(e => e.isPrimary).email; } catch (err) { }
        })
    }

    public departmentsListApiResResolver(res) {
        res.forEach(d => {
            try {
                if (typeof d.campus == 'object') {
                    d.campusName = d.campus.name;
                    d.campus = d.campus._id;
                }
            } catch (err) { }
        })
    }


    // ##################################################################### //
    //  This function will be called when we are at waiting users pageXOffset 
    //  and user will click the approve icon defined in users.routing route params
    // ##################################################################### //
    public iconClickedApprove(e, icon, row, componentContext: CustomTableComponent, routeData: any) {
        // console.log(e, icon, row, componentContext);
        let newModel = _.cloneDeep(row);
        newModel.accountStatus = 'approved';
        newModel.notifyApproval = true;
        let url = icon && icon.url ? icon.url : routeData.url;
        componentContext.authService.put(`${url}/${newModel[routeData.primaryKey]}`, newModel).subscribe(res => {
            componentContext.toastr.success(`The user has been approved & notified successfully`);
            _.remove(componentContext.allRecords, row);
            componentContext.setTableDataAfterDataDecided(componentContext.allRecords);
        })
    }

    public classSubjectsIconClicked(e, icon, row, componentContext: CustomTableComponent, routeData: any) {
        componentContext.router.navigate([`/configurations/classes/subjects/${row._id}`]);
    }
    /* -------------------------------------------------------------------------- */
    /*            Callback emitted when the cutom-table any of crud is            */
    /*              performed Callback defined in campus CRUD config              */
    /* -------------------------------------------------------------------------- */
    resetCampusCache(event) {
        // this.departmentService.resetCampusCache();
    }
    /* ----------------------------------- -- ----------------------------------- */

}