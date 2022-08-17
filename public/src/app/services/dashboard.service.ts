import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { CommonScripts } from '../scripts/CommonScripts';
import { AppSettings } from '@/settings';
import { Subject } from 'rxjs';
import { AclService } from './acl.service';
import { CacheHandler } from '@/scripts';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private dialogSubject = new Subject();
    private menuSubject = new Subject();
    private homeEventsSubject = new Subject();

    dptLink: string;

    lastRelease: {
        _id: string,
        name: string,
        version: string,
        notes: string
    }

    constructor(
        private router: Router,
        private aclService: AclService,
        private authSvc: AuthService
    ) {
        this.refreshDashboardCards();

        this.aclService.getAclChangedSubject().subscribe(res => {
            this.refreshDashboardCards();
        })
        this.fetchRelease();
    }
    navLists = AppSettings.NAV_LISTS;
    routeData: any = {};
    ////////////////////////////
    currentSection = 'users';
    currentList: {
        title: string,
        routerLink: string,
        activeLinks: string[],
        icon?: string,
        checkRouteDataTooToActiveLink?: boolean
    }[];
    selectedIndex = 0;
    /////////////////////////////
    fetchRelease() {
        if (this.authSvc.isLoggedIn()) {
            this.authSvc.get(`${AppSettings.API_ENDPOINT}/release-notes/latest`).subscribe(res => {
                this.lastRelease = <any>res;
            })
        }
    }
    getDialogSubject() {
        return this.dialogSubject;
    }
    getMenuSubject() {
        return this.menuSubject;
    }
    getHomeEventsSubject() {
        return this.homeEventsSubject;
    }

    showMenu() {
        this.menuSubject.next(false);
    }
    hideMenu() {
        this.menuSubject.next(true);
    }

    setRouteData(data) {
        this.routeData = data;
        this.selectDefaultListAndItem();
    }

    publishHomeEvent(type: 'dialog-notifications', data?: any) {
        this.homeEventsSubject.next({ type, data });
    }

    publishDefaultList(listItem: { title: string, routerLink: string, activeLinks: string[], icon: string, checkRouteDataTooToActiveLink?: boolean }[], selectedItemNumber?) {
        setTimeout(() => {

            this.currentList = listItem;
            if (!selectedItemNumber)
                this.getSelectedNavlistItem();
            else {
                this.selectedIndex = selectedItemNumber - 1;
            }

            if (this.currentList && this.currentList.length) {
                setTimeout(() => {

                    this.showMenu();
                }, 0);
            }
        }, 0);
    }
    setNavListSelectedIndex(index) {
        if (this.currentList && index < this.currentList.length) {
            this.selectedIndex = index;
        } else {
            console.warn(`Cannot set selectedIndex to ${index}`, this.currentList);
        }
    }

    selectDefaultListAndItem() {
        this.currentSection = this.routeData.section;
        try {
            let list = this.navLists[this.currentSection].reduce((list, listItem) => {
                if (!listItem.permissions || this.aclService.allowObj(listItem.permissions)) {
                    list.push(listItem);
                }
                return list;
            }, []);
            this.currentList = list;
        } catch (err) {

        }
        if (this.currentList && this.currentList.length) {
            this.getSelectedNavlistItem();
            if (this.routeData && !this.routeData.hideSideNav) {
                setTimeout(() => this.showMenu());
            }
        } else {
            setTimeout(() => this.hideMenu());
        }

    }
    refreshDashboardCards() {
        this.dashboardCards = [];

        let user = CacheHandler.getStoredUser();

        if (this.aclService.allowObj({ app: { codes: ['user_view_sec', 'user_view_all'], logic: 'or' } })) {
            this.dashboardCards.push({
                title: 'Users',
                color: '#009cd0',
                animateCss: CommonScripts.getAnimateCss(),
                routerLink: '/users',
                selected: this.routeData.section == 'users',
                imgSrc: 'assets/icons/user-icon.png',

                navImg: 'assets/images/svg/resources.svg',
                navFa: '',
                module: 'users',
                animate: true
            });
        }

        if (this.aclService.allow('conf_view')) {
            this.dashboardCards.push({
                title: 'Configurations',
                color: '#009cd0',
                animateCss: CommonScripts.getAnimateCss(),
                routerLink: '/configurations',
                selected: this.routeData.section == 'configurations',
                imgSrc: 'assets/icons/configurations.png',

                navImg: 'assets/images/svg/configurations.svg',
                navFa: '',
                module: 'configurations',
                animate: true
            });
        }

        if (this.aclService.allow('manage_companies')) {
            this.dashboardCards.push({
                title: 'Companies',
                color: '#009cd0',
                animateCss: CommonScripts.getAnimateCss(),
                routerLink: '/companies',
                selected: this.routeData.section == 'companies',
                imgSrc: 'assets/icons/companies.png',

                navImg: '',
                navFa: 'fa fa-building',
                module: 'companies',
                animate: true
            });
        }

        if (this.aclService.allow('manage_tweets')) {
            this.dashboardCards.push({
                title: 'Tweets',
                color: '#009cd0',
                animateCss: CommonScripts.getAnimateCss(),
                routerLink: '/tweets',
                selected: this.routeData.section == 'tweets',
                imgSrc: 'assets/icons/tweets.png',

                navImg: 'assets/images/svg/twitter.svg',
                navFa: '',
                module: 'tweets',
                animate: true
            });
        }


        this.dashboardCards.push({
            title: 'Tweets Feed',
            color: '#009cd0',
            animateCss: CommonScripts.getAnimateCss(),
            routerLink: '/feed',
            selected: this.routeData.section == 'feed',
            imgSrc: 'assets/icons/feed.png',

            // navImg: 'assets/images/svg/twitter.svg',
            navFa: 'fa fa-rss',
            module: 'feed',
            animate: true
        });


    }
    getSelectedNavlistItem() {
        if (this.currentList) {
            this.selectedIndex = this.currentList.findIndex(l => {
                let found = false;
                if (l.checkRouteDataTooToActiveLink) {
                    // found = this.routeData.navItemActiveLinkInRouteData == l.activeLinks// || this.routeData.navItemActiveLinkInRouteData.indexOf(l.activeLinks) > -1 || l.activeLinks.indexOf(this.routeData.navItemActiveLinkInRouteData) > -1;
                    found = l.activeLinks.includes(this.routeData.navItemActiveLinkInRouteData)
                }
                if (!found) {
                    for (let activeLink of l.activeLinks) {
                        if (activeLink == this.router.url) {
                            found = true;
                            break;
                        }
                    }
                }
                return found;
            })
        }
    }

    dashboardCards = []

    //////////////////////
    searchSession: any = {};
    searchEmitter: EventEmitter<string> = new EventEmitter();
    scrollEmitter: EventEmitter<boolean> = new EventEmitter();
    searchValue: string;
    setSearchSession(routerUrl, value) {
        this.searchSession[routerUrl] = { routerUrl, value };
    }

    checkSearchSession(routerUrl) {
        let session = this.searchSession[routerUrl];
        if (session) {
            delete this.searchSession[routerUrl];
            this.searchGlobally(session.value);
        }
    }
    getSearchSession(routerUrl, delAfterRead) {
        let session = this.searchSession[routerUrl];
        if (session && delAfterRead) {
            delete this.searchSession[routerUrl];
        }
        return session;
    }

    getSearchEmitter(reset?) {
        if (reset) {
            this.resetSearchValue();
        }
        return this.searchEmitter;
    }
    resetSearchValue() {
        this.searchValue = "";
    }

    searchGlobally(value, callFromSession?) {
        this.searchValue = value;
        this.searchEmitter.emit(this.searchValue);
        if (callFromSession) {
            let that = this;
            setTimeout(() => {
                // that.navComponent.showSearchBar(null, true);
            }, 500);
        }
    }

    showInfoDialog(title, subTitle, dialogType: 'success' | 'error' | 'warn' | 'info', callback?, dontShowButtonLocalStorageKey?) {
        // let dialog = this.dialog.open(CustomFormDialogComponent);
        // dialog.componentInstance.dialogRole = "info";
        // dialog.componentInstance.dialogType = dialogType;
        // dialog.componentInstance.title = title;
        // dialog.componentInstance.subTitle = subTitle;
        // dialog.afterClosed().subscribe(res => {
        //     if (callback) callback();
        // })
        this.dialogSubject.next({
            dialogRole: 'info',
            dialogType,
            title,
            subTitle,
            callback,
            dontShowButtonLocalStorageKey
        })
    }

    showConfirmDialog(title, subTitle, callback?, yesButtonText?, noButtonText?) {
        this.dialogSubject.next({
            dialogRole: 'confirm',
            title,
            subTitle,
            yesButtonText,
            noButtonText,
            callback
        })
    }

    focusControl(id, scrollTo?, delay?) {
        setTimeout(() => {
            try {
                let ele = document.getElementById(id);
                ele.click();

                if (scrollTo) {
                    ele.scrollIntoView();
                }
            } catch (err) { }
        }, delay || 600);
    }

    getContactNumbers(q?, options?) {
        let url = `${AppSettings.API_ENDPOINT}/dashboard/contact-numbers?${q || ''}`;
        return this.authSvc.get(url, options);
    }
    sendNotifications(model, options) {
        let url = `${AppSettings.API_ENDPOINT}/dashboard/send-bulk-notifications`;
        return this.authSvc.post(url, model, options);
    }

    showOnlineFeeNotice(dontShowButtonLocalStorageKey) {
        this.showInfoDialog(`Important Notice`, `
		<div style="text-align: justify;font-size: 17px;line-height: 30px;">
			<p style="font-size: 17px; font-weight: bold;">Students are advised to Choose "Pay" option instead of "Transfer" while paying their University of Sargodha fee, via HBL app, following these steps:
			</p>
			<p><b>Step 1.</b> Open HBL App. </p>
			<p><b>Step 2.</b> Choose "Pay" option. <a target='_blank' href="https://su.edu.pk/uploads/challan_guidlines/1st.jpeg">click to view image</a> </p>
			<p><b>Step 3.</b> Make New Payment.  </p>
			<p><b>Step 4.</b> Choose "Education" from purpose. <a target='_blank' href="https://su.edu.pk/uploads/challan_guidlines/2nd.jpeg">click to view image</a></p>
			<p><b>Step 5.</b> Choose "University of Sargodha" from Institutions list. <a target='_blank' href="https://su.edu.pk/uploads/challan_guidlines/3rd.jpeg">click to view image</a></p>
			<p><b>Step 6.</b> Enter 10 Digit Fee Challan Number provided on Online Fee Challan, Student Name, Father Name, CNIC, Select Fee Type "University of Sargodha". All fields should be filled / chosen carefully. <a target='_blank' href="https://su.edu.pk/uploads/challan_guidlines/4th.jpeg">click to view image</a></p>
			<p><b>Step 7.</b> Tap Next and Pay</p>
		</div>
		`, `info`, null, dontShowButtonLocalStorageKey);
    }


}