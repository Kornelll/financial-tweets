import { Component, Input, OnInit, ViewChild, ComponentFactoryResolver, OnDestroy } from '@angular/core';
import { DynamicDirective } from 'src/app/directives/dynamic-host.directive';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'dynamic-component-dialog',

	templateUrl: './dynamic-component-dialog.component.html',
	styleUrls: ['./dynamic-component-dialog.component.scss']
})

export class DynamicComponentDialogComponent implements OnInit {

	dynamicDialogComponentInstance;
	_component;
	@Input() set component(component) {
		this._component = component;
		// this.loadComponent();

	}
	get component() {
		return this._component;
	}

	@ViewChild(DynamicDirective, { static: true }) adHost: DynamicDirective;

	constructor(
		private componentFactoryResolver: ComponentFactoryResolver,
		public dialogRef: MatDialogRef<DynamicComponentDialogComponent>
	) { }

	ngOnInit() {
	}

	ngOnDestroy() {
	}

	loadComponent(data?: [{ field: string, value: any }]) {
		if (this.component) {
			const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);

			const viewContainerRef = this.adHost.viewContainerRef;
			viewContainerRef.clear();

			const componentRef = viewContainerRef.createComponent(componentFactory);
			this.dynamicDialogComponentInstance = <any>componentRef.instance;
			(data || []).forEach(d => {
				this.dynamicDialogComponentInstance[d.field] = d.value;
			});
			setTimeout(() => {
				
				this.dynamicDialogComponentInstance.dialogRef.afterClosed().subscribe(res => {
					this.dialogRef.close(res);
				});
			}, 0);
		} else {
			alert("Dynamic component loaded component got no component :-(");
		}
	}
}

// https://stackblitz.com/angular/xeldroooopg