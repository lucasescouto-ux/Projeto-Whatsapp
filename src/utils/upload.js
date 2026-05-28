import { Firebase } from "./firebase";

export class Upload {

    static send(file, from) {

        return new Promise((s, f) => {

            let uploadTask = Firebase
                .storage()
                .ref(from)
                .child(Date.now() + '_' + file.name)
                .put(file);

            uploadTask.on('state_changed', snapshot => {

                console.log('upload', snapshot);

            }, err => {

                f(err);

            }, () => {

                s(uploadTask.snapshot);

            });

        });
    }
}