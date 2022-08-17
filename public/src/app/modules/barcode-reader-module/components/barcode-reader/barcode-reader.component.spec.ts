import { TestBed, inject } from '@angular/core/testing';

import { BarcodeReaderComponent } from './barcode-reader.component';

describe('a barcode-reader component', () => {
	let component: BarcodeReaderComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				BarcodeReaderComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([BarcodeReaderComponent], (BarcodeReaderComponent) => {
		component = BarcodeReaderComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});