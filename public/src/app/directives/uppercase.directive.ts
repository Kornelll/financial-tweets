import { Directive, ElementRef, Input } from '@angular/core';
@Directive({
    selector: '[UpperCase]',
    host: {
        '(input)': 'toUpperCase($event.target.value)',

    }

})
export class UpperCaseTextDirective {

    @Input('UpperCase') allowUpperCase: boolean = true;
    constructor(private ref: ElementRef) {
    }

    toUpperCase(value: any) {
        if (this.allowUpperCase)
            this.ref.nativeElement.value = value.toUpperCase();
    }

}