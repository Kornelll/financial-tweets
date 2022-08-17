import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'showFields'
})
export class ShowFieldsPipe implements PipeTransform {
    transform(obj, fields: string[], codesSaperator, itemsSaperator): string {
        return ShowFieldsPipe.showFields(obj, fields, codesSaperator, itemsSaperator);
    }

    public static showFields(obj: any, fields: string[], codesSaperator: string, itemsSaperator: string) {

        let value = '';


        if (obj && obj.constructor != Array) {
            obj = [obj];
        }

        obj.forEach((ob, i) => {
            fields.forEach((field, j) => {
                value += `${ob[field]}`;

                if(j < fields.length -1 && codesSaperator) value += codesSaperator;
            })
            if(i < obj.length -1 && itemsSaperator) value += itemsSaperator;
        });
        return value;
    }
}