import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '@/services';
import { map } from 'rxjs/operators';
import { AppSettings } from '@/settings';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    _URL = `${AppSettings.API_ENDPOINT}/documents`; //-- base url for documents
    globalDocumentUploadedEmitter = new EventEmitter()
    response: any[] = [];
    constructor(public _auth: AuthService) { }
    getAllRecords() {
        return this.getRecords(this._URL);
    }
    getAllRecordsByQuery(q) {
        return this.getRecords(this._URL + "/" + q);
    }
    getRecords(url) {
        return this._auth.get(url).pipe(
            map((response: any) => <any>response))
    }
    getRecordById(id: number) {
        return this._auth.get(this._URL + "/" + id)
            .pipe(map((response: any) => <any>response))
    }
    create(model): Observable<any> {
        return this._auth.post(this._URL, model)
    }
    update(model) {
        return this._auth.put(this._URL + "/" + model.id, model)
    }
    delete(id) {
        return this._auth.delete(this._URL + "/" + id)
    }

    public handleError(error: Response) {
        return Observable.throw(error || 'Server error');
    }
}
