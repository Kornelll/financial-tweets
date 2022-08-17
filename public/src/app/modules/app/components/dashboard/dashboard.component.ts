import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '@/services';

@Component({
	selector: 'dashboard',
	templateUrl: 'dashboard.component.html',
	styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

	constructor(
		public dashboardService: DashboardService,
		public router: Router
	) {
		this.dashboardService.refreshDashboardCards();
		setTimeout(() => {
			this.dashboardService.dashboardCards.forEach(card => {
				delete card.animate;
			})
		}, 2000);
	}
	ngOnInit() { }

	cardClicked(card) {
		delete card.animate;
		if (card.routerLink) {
			this.router.navigate([card.routerLink])
		} else if(card.context && card.callback) {
			card.callback.call(card.context);
		}
	}
}