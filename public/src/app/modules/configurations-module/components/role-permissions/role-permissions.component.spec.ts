import { TestBed, inject } from '@angular/core/testing';

import { RolePermissionsComponent } from './role-permissions.component';

describe('a role-permissions component', () => {
	let component: RolePermissionsComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				RolePermissionsComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([RolePermissionsComponent], (RolePermissionsComponent) => {
		component = RolePermissionsComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});