export class Base64 {

    static toDataURL(file) {
        if (typeof file === 'string' && file.indexOf('data:') === 0) {
            return Promise.resolve(file);
        }

        return new Promise((resolve, reject) => {
            let reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    static imageToDataURL(file, maxSize = 900, quality = .82) {
        if (!file.type || file.type.indexOf('image/') !== 0) {
            return Base64.toDataURL(file);
        }

        if (file.type === 'image/gif') {
            return Base64.toDataURL(file);
        }

        return new Promise((resolve, reject) => {
            let reader = new FileReader();

            reader.onload = () => {
                let image = new Image();

                image.onload = () => {
                    let ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
                    let canvas = document.createElement('canvas');
                    let context = canvas.getContext('2d');
                    let mimeType = 'image/jpeg';

                    canvas.width = Math.round(image.width * ratio);
                    canvas.height = Math.round(image.height * ratio);

                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL(mimeType, quality));
                };

                image.onerror = reject;
                image.src = reader.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    static getMimeType(base64) {
        let result = base64.match(/^data:(.+);base64,/);
        return result ? result[1] : null;
    }

    static toFile(base64) {
        return new Promise((resolve, reject) => {
            let mimeType = Base64.getMimeType(base64);

            if (!mimeType) {
                reject(new Error('Base64 inválido'));
                return;
            }

            let ext = mimeType.split('/')[1];
            let filename = `preview.${ext}`;

            fetch(base64)
                .then(res => res.arrayBuffer())
                .then(buffer => {
                    resolve(new File([buffer], filename, {
                        type: mimeType
                    }));
                })
                .catch(reject);
        });
    }
}
