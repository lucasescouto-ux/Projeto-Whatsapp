class  whatsappcontroller {

    constructor(){

        console.log("Whats OK!");

        this.loadElements();
    }

    loadElements(){

        this.el = {};

        document.querySelectorAll("[id]").forEach(element=>{

            this.el[format.getCamelCase(element.id)] = element;


        });
    }
}