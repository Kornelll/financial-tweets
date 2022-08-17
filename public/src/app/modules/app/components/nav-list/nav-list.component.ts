import { MatDialog } from '@angular/material';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DashboardService } from '@/services';

@Component({
	selector: 'nav-list',
	templateUrl: 'nav-list.component.html',
	styleUrls: ['./nav-list.component.scss']
})

export class NavListComponent implements OnInit {

	
	
	constructor(
		public router: Router,
		public dialog: MatDialog,
		// public toastr: ToastrService,
		public dashboardService: DashboardService
	) {
		
	}

	ngOnInit() {
		
	}
}