import { AppSettings } from '@/settings';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TweetService {

    constructor(
        private httpClient: HttpClient
    ) { }

    getTweets(q?: string) {
        let url = `${AppSettings.API_ENDPOINT}/tweets`;
        if(q) url += `?${q}`;
        return this.httpClient.get(url);
    }

}
