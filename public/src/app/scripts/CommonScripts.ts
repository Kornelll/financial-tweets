import * as moment from 'moment';

export class CommonScripts {

    public static getRandomColor(): string {

        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    public static getAnimateCss(options?) {
        let animateCssClass = [
            "bounce",
            // "flash",
            "pulse",
            "rubberBand",
            // "shake",
            // "headShake",
            "swing",
            "tada",
            "wobble",
            "jello",
            "bounceIn",
            "bounceInDown",
            "bounceInLeft",
            "bounceInRight",
            "bounceInUp",
            "fadeIn",
            "fadeInDown",
            "fadeInDownBig",
            "fadeInLeft",
            "fadeInLeftBig",
            "fadeInRight",
            "fadeInRightBig",
            "fadeInUp",
            "fadeInUpBig",
            "flipInX",
            "flipInY",
            "lightSpeedIn",
            "rotateIn",
            "rotateInDownLeft",
            "rotateInDownRight",
            "rotateInUpLeft",
            "rotateInUpRight",
            "jackInTheBox",
            "rollIn",
            "zoomIn",
            "zoomInDown",
            "zoomInLeft",
            "zoomInRight",
            "zoomInUp",
            "slideInDown",
            "slideInLeft",
            "slideInRight",
            "slideInUp",
            "heartBeat"
        ];
        return animateCssClass[Math.floor(Math.random() * animateCssClass.length) + 1];
    }

    /* -------------------------------------------------------------------------- */
    /*                         Color Tricks and Hacks :-)                         */
    /* https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb      */
    /* https://stackoverflow.com/questions/1855884/determine-font-color-based-on-background-color      */
    /* -------------------------------------------------------------------------- */
    public static contrastColor(color) {
        var d = 0;
        let rgb = CommonScripts.hexToRgb(color);
        // Counting the perceptive luminance - human eye favors green color... 
        var luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

        if (luminance > 0.5)
            d = 0; // bright colors - black font
        else
            d = 255; // dark colors - white font

        return CommonScripts.rgbToHex(d, d, d);
    }

    public static hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    public static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    /* ----------------------------------- COLOR END ---------------------------------- */

    public static getFileUploadError(item, filter, uploader): string {
        console.log(item, uploader);
        let errMsg;
        switch (filter.name) {
            case 'fileSize':
                errMsg = '"' + item.name + '"' + ' file size exceeded, maximum ' + (uploader.options.maxFileSize / 1048576) + 'MB file allowed.'; break;
            case 'fileType':
                errMsg = '"' + item.name + '"' + ' file type incorrect, allowed: ' + uploader.options.allowedFileType.join(', '); break;
            case 'queueLimit':
                errMsg = `Maximum ${uploader.options.queueLimit} files are allowed in queue.`; break;
            default:
                errMsg = 'Invalid File, please choose different file.';
        }
        return errMsg;
    }


    public static groupDateWeekMonthRange(array, dateField) {
        let dates = {
            today: moment().format("YYYY-MM-DD"),
            week: { start: moment().startOf('week'), end: moment().endOf('week') },
            month: { start: moment().startOf('month'), end: moment().endOf('month') }
        };
        let todayData = [], weekData = [], monthData = [], olderData = [];
        array.forEach(complaint => {
            let createdAt = moment(complaint[dateField]);
            if (createdAt.format("YYYY-MM-DD") == dates.today) {
                todayData.push(complaint);
            } else if (createdAt >= dates.week.start && createdAt <= dates.week.end) {
                weekData.push(complaint);
            } else if (createdAt >= dates.month.start && createdAt <= dates.month.end) {
                monthData.push(complaint);
            } else {
                olderData.push(complaint);
            }
        })
        return [
            { type: 'Today', data: todayData },
            { type: 'This Week', data: weekData },
            { type: 'This Month', data: monthData },
            { type: 'Older', data: olderData }
        ]
    }

    public static getDatesRange(startDate, stopDate) {
        var dateArray = [];
        var currentDate = moment(startDate);
        stopDate = moment(stopDate);
        while (currentDate <= stopDate) {
            dateArray.push(moment(currentDate).format('YYYY-MM-DD'))
            currentDate = moment(currentDate).add(1, 'days');
        }
        return dateArray;
    }
}