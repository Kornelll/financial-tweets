import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'dotfield'
})
export class DotfieldPipe implements PipeTransform {
    transform(obj, field): string {
        return DotfieldPipe.dottedField(obj, field);
    }

    public static dottedField(obj, field2) {
        let fields = field2.split(".");
        let value = obj;
        fields.forEach(field => {
            try {
                value = value[field];
            } catch (err) {
                console.warn("Error", obj, field2);
            }
        })
        return value || '';
    }
}