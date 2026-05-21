export class CameraController {

    constructor(videoEl) {

        this._videoEl = videoEl;

        navigator.mediaDevices.getUserMedia({
            video: true
        }).then(stream => {

            this._stream = stream;
            this._videoEl.srcObject = stream;
            this._videoEl.play();

        }).catch(err => {
            console.error("Erro ao acessar câmera:", err);
        });
    }

    stop(){

        this._stream.getTracks().forEach(tracks=>{

                tracks.stop();
            });
    }
}