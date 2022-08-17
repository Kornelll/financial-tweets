import { TestBed, inject } from '@angular/core/testing';

import { DynamicComponentDialogComponent } from './dynamic-component-dialog.component';

describe('a dynamic-component-dialog component', () => {
	let component: DynamicComponentDialogComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				DynamicComponentDialogComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([DynamicComponentDialogComponent], (DynamicComponentDialogComponent) => {
		component = DynamicComponentDialogComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});