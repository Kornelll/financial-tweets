import { TestBed, inject } from '@angular/core/testing';

import { OrgListComponent } from './nav-list.component';

describe('a org-list component', () => {
	let component: OrgListComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				OrgListComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([OrgListComponent], (OrgListComponent) => {
		component = OrgListComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});