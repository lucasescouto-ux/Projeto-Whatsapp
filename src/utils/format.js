export class format {

    static getCamelCase(text){

        let div = document.createElement("div");

        div.innerHTML = `<div data-${text}="id"></div>`;

        return Object.keys(div.firstChild.dataset)[0];
        
    }

    static dateToTime(date, locale = 'pt-BR'){

        return date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static timeStampToTime(timeStamp) {
            if (!timeStamp) return '';

            if (typeof timeStamp.toDate === 'function') {
                return format.dateToTime(timeStamp.toDate());
            }

            if (timeStamp instanceof Date) {
                return format.dateToTime(timeStamp);
            }

        return '';
    }
}