import { Injectable, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { AppSettings } from '@/settings';
import { Encrytojs, CacheHandler } from '@/scripts';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import * as _ from 'lodash';


@Injectable({
    providedIn: 'root'
})
export class ConfigurationsService {

    public URL = `${AppSettings.API_ENDPOINT}/applications`;

    constructor(
        public http: HttpClient,
        private authSvc: AuthService,
    ) {
    }

    

    saveDegree(model) {
        return this.authSvc.post(`${AppSettings.API_ENDPOINT}/degrees`, model);
    }
    updateDegree(id, model) {
        return this.authSvc.put(`${AppSettings.API_ENDPOINT}/degrees/${id}`, model);
    }

    getDegrees(q?) {
        return this.authSvc.get(`${AppSettings.API_ENDPOINT}/degrees?${q || ''}`);
    }

    getCategories(q) {
        return this.authSvc.get(`${AppSettings.API_ENDPOINT}/categories?${q || ''}`);
    }


    public handleError(error: Response) {
        return Observable.throw(error || 'Server error');
    }
}
