import { TweetService } from '@/services';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {

  $destroy = new Subject();
  lastPage = 0;
  data = [];
  lastResultZero = true;
  fetching = false;
  totalRecords = 0;
  perPage = 50;

  inputCtrl = new FormControl();
  inputCompanyCtrl = new FormControl();
  verified = false;

  constructor(
    private tweetSvc: TweetService
  ) {
    this.inputCtrl.valueChanges.pipe(debounceTime(600), distinctUntilChanged())
      .subscribe(res => {
        this.resetAndFetch();
      })
    this.inputCompanyCtrl.valueChanges.pipe(debounceTime(600), distinctUntilChanged())
      .subscribe(res => {
        this.resetAndFetch();
      })
  }

  ngOnInit() {
    this.fetchTweets();
  }

  resetAndFetch() {
    this.totalRecords = 0;
    this.data = [];
    this.lastPage = 0;
    this.fetchTweets();
  }

  fetchTweets(): void {
    this.fetching = true;
    let q = `perPage=${this.perPage}&page=${++this.lastPage}`;
    if (this.inputCtrl.value) {
      q += `&q=${encodeURIComponent(this.inputCtrl.value)}`;
    }
    if (this.inputCompanyCtrl.value) {
      q += `&companyName=${encodeURIComponent(this.inputCompanyCtrl.value)}`;
    }
    if(this.verified) {
      q += `&verified=true`;
    }
    this.tweetSvc.getTweets(q).pipe(takeUntil(this.$destroy)).subscribe((res: any) => {
      this.data = this.data.concat(res.data);
      this.lastResultZero = !res.data.length;
      this.totalRecords = res.count;
    })
      .add(() => {
        this.fetching = false;
      })
  }

  ngOnDestroy(): void {
    this.$destroy.next();
  }

}
