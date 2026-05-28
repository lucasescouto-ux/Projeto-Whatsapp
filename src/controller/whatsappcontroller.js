import { format } from './../utils/format';
import { CameraController } from './cameracontroller';
import { MicrophoneController } from './microphonecontroller';
import { DocumentPreviewController } from './documentpreviewcontroller';
import { Firebase } from '../utils/firebase';
import { User } from '../model/user';
import { Chat } from '../model/chat';
import { Message } from '../model/message'
import { Base64 } from '../utils/base64';
import { ContactsController } from './contactscontroller';
import { Upload } from '../utils/upload';

export default class  whatsappcontroller {

    constructor(){

        console.log("Whats OK!");

        this.elementsPrototype();
        this.loadElements();
        this._lastContactMessageTimes = {};
        this.initEvents();
        this.initNotifications();

        this._firebase = new Firebase();
        this._contactUserUnsubscribes = {};
        this._contactsByEmail = {};
        this.initAuth();


    }

    initAuth(){

        this._firebase.initAuth()
        .then(response=>{

            this._user = new User(response.user.email);

            this._user.on('datachange', data => {

                let name = data.name || response.user.displayName || '';

                document.querySelector('title').innerHTML = name + ' - WhatsApp Clone';

                this.el.inputNamePanelEditProfile.innerHTML = name;

                if (data.photo) {
                    this.el.imgPanelEditProfile.src = data.photo;
                    this.el.imgPanelEditProfile.show();
                    this.el.imgDefaultPanelEditProfile.hide();

                    let photo2 = this.el.myPhoto.querySelector('img');
                    photo2.src = data.photo;
                    photo2.show();
                    }

                    this.initContacts();
                });

                this._user.ready().then(() => {

                    if (!this._user.name && response.user.displayName) {
                        this._user.name = response.user.displayName;
                    }

                    this._user.email = response.user.email;

                    if (!this._user.photo && response.user.photoURL) {
                        this._user.photo = response.user.photoURL;
                    }

                    return this._user.save();
                }).then(() => {

                    this.el.appContent.css({
                        display: 'flex'
                    });

                    this.initPresence();
                }).catch(err => {

                    console.error(err);
            });
        })
        .catch(err=>{
            
            console.error(err);
        });
    }

    initPresence() {

        if (this._presenceInitialized || !this._user || !this._user.email) return;

        this._presenceInitialized = true;

        this.updateMyPresence(true);

        window.addEventListener('focus', e => {
            this.updateMyPresence(true);
        });

        document.addEventListener('visibilitychange', e => {
            this.updateMyPresence(!document.hidden);
        });

        window.addEventListener('beforeunload', e => {
            this.updateMyPresence(false);
        });

        window.addEventListener('pagehide', e => {
            this.updateMyPresence(false);
        });
    }

    updateMyPresence(online) {

        if (!this._user || !this._user.email) return;

        this._user.online = online;
        this._user.lastSeen = new Date();

        User.findbyEmail(this._user.email).set({
            online,
            lastSeen: this._user.lastSeen
        }, {
            merge: true
        }).catch(err => console.error(err));
    }

    initNotifications() {

        this._notificationsSupported = 'Notification' in window;

        if (!this.el.alertNotificationPermission) return;

        this.el.alertNotificationPermission.on('click', e => {

            this.requestNotificationPermission();
        });

        this.updateNotificationPermissionAlert();
    }

    updateNotificationPermissionAlert() {

        if (!this.el.alertNotificationPermission) return;

        if (this._notificationsSupported && Notification.permission === 'default') {
            this.el.alertNotificationPermission.show();
        } else {
            this.el.alertNotificationPermission.hide();
        }
    }

    requestNotificationPermission() {

        if (!this._notificationsSupported) {
            alert('Este navegador nÃ£o suporta notificaÃ§Ãµes na Ã¡rea de trabalho.');
            return Promise.resolve('unsupported');
        }

        return Notification.requestPermission().then(permission => {

            this.updateNotificationPermissionAlert();

            if (permission === 'granted') {
                this.showDesktopNotification({
                    name: 'WhatsApp Clone',
                    lastMessage: 'NotificaÃ§Ãµes ativadas.'
                }, {
                    tag: 'notifications-enabled',
                    autoClose: 4000
                });
            }

            return permission;
        }).catch(err => {

            console.error(err);
            return 'denied';
        });
    }

    getContactMessageTime(contact) {

        if (!contact || !contact.lastMessageTime) return 0;

        if (typeof contact.lastMessageTime.toMillis === 'function') {
            return contact.lastMessageTime.toMillis();
        }

        if (typeof contact.lastMessageTime.toDate === 'function') {
            return contact.lastMessageTime.toDate().getTime();
        }

        if (contact.lastMessageTime instanceof Date) {
            return contact.lastMessageTime.getTime();
        }

        return Number(contact.lastMessageTime) || 0;
    }

    stripNotificationText(text) {

        return this.getSidebarLastMessageText(text) || 'Nova mensagem';
    }

    handleContactNotification(contact) {

        if (!contact || !contact.email) return;

        let lastMessageTime = this.getContactMessageTime(contact);
        let previousTime = this._lastContactMessageTimes[contact.email];

        if (!lastMessageTime) {
            if (previousTime === undefined) {
                this._lastContactMessageTimes[contact.email] = 0;
            }

            return;
        }

        this._lastContactMessageTimes[contact.email] = lastMessageTime;

        if (previousTime === undefined || lastMessageTime <= previousTime) return;
        if (contact.lastMessageFrom && contact.lastMessageFrom === this._user.email) return;

        this.showDesktopNotification(contact, {
            tag: `chat-${contact.email}`
        });
    }

    showDesktopNotification(contact, options = {}) {

        if (!this._notificationsSupported || Notification.permission !== 'granted') return;

        let notification = new Notification(contact.name || contact.email || 'Nova mensagem', {
            body: this.stripNotificationText(contact.lastMessage),
            icon: contact.photo || 'img/HcodeWhatsAppClone.png',
            tag: options.tag || `chat-${contact.email || 'default'}`,
            renotify: true
        });

        notification.onclick = e => {

            window.focus();

            if (contact.email) {
                let contactItem = this.el.contactsMessagesList.querySelector(
                    `.contact-item[data-email="${contact.email}"]`
                );

                if (contactItem) contactItem.click();
            }

            notification.close();
        };

        setTimeout(() => notification.close(), options.autoClose || 8000);
    }

    getDateValue(value) {

        if (!value) return null;

        if (typeof value.toDate === 'function') return value.toDate();
        if (value instanceof Date) return value;

        let date = new Date(value);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    formatContactPresence(contact) {

        if (!contact) return '';
        if (contact.online) return 'online';

        let lastSeen = this.getDateValue(contact.lastSeen);

        if (lastSeen) {
            return `visto por \u00faltimo \u00e0s ${format.dateToTime(lastSeen)}`;
        }

        return contact.status || '';
    }

    valuesAreEqual(value1, value2) {

        let date1 = this.getDateValue(value1);
        let date2 = this.getDateValue(value2);

        if (date1 || date2) {
            return Boolean(date1 && date2 && date1.getTime() === date2.getTime());
        }

        return value1 === value2;
    }

    escapeHTML(text) {

        let div = document.createElement('div');
        div.textContent = text || '';

        return div.innerHTML;
    }

    getSidebarLastMessageText(message) {

        if (!message) return '';

        let div = document.createElement('div');
        div.innerHTML = message;

        div.querySelectorAll('img, .emoji, .emojik').forEach(emoji => {

            let unicode = emoji.getAttribute('alt') || emoji.dataset.unicode || emoji.textContent || '';
            emoji.parentNode.replaceChild(document.createTextNode(unicode), emoji);
        });

        return (div.textContent || div.innerText || message).trim();
    }

    getSidebarLastMessageHTML(message) {

        return this.escapeHTML(this.getSidebarLastMessageText(message));
    }

    getLastMessageStatusClass(contact) {

        return contact && contact.lastMessageStatus === 'read' ? 'read' : '';
    }

    initContacts(){

        if (this._contactsInitialized) return;

        this._contactsInitialized = true;

        this._user.on('contactschange', docs =>{

            this.el.contactsMessagesList.innerHTML = '';
            this._contactsByEmail = {};
            let renderedEmails = {};

            docs.forEach(doc => {

                let contact = doc.data();
                renderedEmails[contact.email] = true;
                this._contactsByEmail[contact.email] = contact;
                this.watchContactProfile(contact);
                this.handleContactNotification(contact);

                let div = document.createElement('div');

                div.className = 'contact-item';
                div.dataset.email = contact.email;
                div.dataset.chatId = contact.chatId;

                div.innerHTML = `
        
                <div class="dIyEr">
                    <div class="_1WliW" style="height: 49px; width: 49px;">
                        <img src="#" class="Qgzj8 gqwaM photo" style="display:none;">
                        <div class="_3ZW2E">
                            <span data-icon="default-user" class="">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212 212" width="212" height="212">
                                    <path fill="#DFE5E7" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z"></path>
                                    <g fill="#FFF">
                                        <path d="M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z"></path>
                                    </g>
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="_3j7s9">
                    <div class="_2FBdJ">
                        <div class="_25Ooe">
                            <span dir="auto" title="${contact.name}" class="_1wjpf">${contact.name}</span>
                        </div>
                        <div class="_3Bxar">
                            <span class="_3T2VG">${contact.lastMessageTime ? format.timeStampToTime(contact.lastMessageTime) : ''}</span>
                        </div>
                    </div>
                    <div class="_1AwDx">
                        <div class="_itDl">
                            <span title="digitando…" class="vdXUe _1wjpf typing" style="display:none">digitando…</span>

                            <span class="_2_LEW last-message">
                                <div class="_1VfKB last-message-status ${this.getLastMessageStatusClass(contact)}">
                                    <span data-icon="status-dblcheck" class="">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                                            <path fill="#263238" fill-opacity=".4" d="M17.394 5.035l-.57-.444a.434.434 0 0 0-.609.076l-6.39 8.198a.38.38 0 0 1-.577.039l-.427-.388a.381.381 0 0 0-.578.038l-.451.576a.497.497 0 0 0 .043.645l1.575 1.51a.38.38 0 0 0 .577-.039l7.483-9.602a.436.436 0 0 0-.076-.609zm-4.892 0l-.57-.444a.434.434 0 0 0-.609.076l-6.39 8.198a.38.38 0 0 1-.577.039l-2.614-2.556a.435.435 0 0 0-.614.007l-.505.516a.435.435 0 0 0 .007.614l3.887 3.8a.38.38 0 0 0 .577-.039l7.483-9.602a.435.435 0 0 0-.075-.609z"></path>
                                        </svg>
                                    </span>
                                </div>
                                <span dir="ltr" class="_1wjpf _3NFp9">${this.getSidebarLastMessageHTML(contact.lastMessage || '')}</span>
                                <div class="_3Bxar">
                                    <span>
                                        <div class="_15G96">
                                            <span class="OUeyt messages-count-new" style="display:none;">1</span>
                                        </div>
                                </span></div>
                                </span>
                        </div>
                    </div>
                </div>
                `;

                if(contact.photo){
                    
                    let img = div.querySelector('.photo');
                    img.src = contact.photo;
                    img.show();
                }

                div.on('click', e=> {

                    console.log(contact.chatId);
                    this.setActiveChat(contact);

                });

                this.el.contactsMessagesList.appendChild(div);
            });

            Object.keys(this._contactUserUnsubscribes).forEach(email => {

                if (!renderedEmails[email]) {
                    this._contactUserUnsubscribes[email]();
                    delete this._contactUserUnsubscribes[email];
                }
            });
        });
         
        this._user.getContacts();
    }

    watchContactProfile(contact) {

        if (!contact || !contact.email || this._contactUserUnsubscribes[contact.email]) return;

        this._contactUserUnsubscribes[contact.email] = User.findbyEmail(contact.email).onSnapshot(doc => {

            if (!doc.exists) return;

            let profile = doc.data();
            let currentContact = this._contactsByEmail[contact.email] || contact;
            let updates = {};

            ['name', 'photo', 'status', 'online', 'lastSeen'].forEach(field => {

                if (profile[field] !== undefined && !this.valuesAreEqual(profile[field], currentContact[field])) {
                    updates[field] = profile[field];
                }
            });

            if (!Object.keys(updates).length) return;

            Object.assign(currentContact, updates);
            this._contactsByEmail[contact.email] = currentContact;
            this.updateRenderedContactProfile(currentContact);

            this._user.updateContact(contact.email, updates)
                .catch(err => console.error(err));
        });
    }

    updateRenderedContactProfile(contact) {

        let item = this.el.contactsMessagesList.querySelector(
            `.contact-item[data-email="${contact.email}"]`
        );

        if (item) {
            let name = item.querySelector('._25Ooe ._1wjpf');
            let photo = item.querySelector('.photo');
            let status = item.querySelector('.last-message-status');
            let lastMessage = item.querySelector('.last-message ._3NFp9');

            if (name) {
                name.innerHTML = contact.name || '';
                name.title = contact.name || '';
            }

            if (photo) {
                if (contact.photo) {
                    photo.src = contact.photo;
                    photo.show();
                } else {
                    photo.src = '#';
                    photo.hide();
                }
            }

            if (status) {
                if (contact.lastMessageStatus === 'read') {
                    status.addClass('read');
                } else {
                    status.removeClass('read');
                }
            }

            if (lastMessage) {
                lastMessage.innerHTML = this.getSidebarLastMessageHTML(contact.lastMessage || '');
            }
        }

        if (this._contactActive && this._contactActive.email === contact.email) {
            Object.assign(this._contactActive, contact);
            this.el.activeName.innerHTML = contact.name || '';
            this.el.activeStatus.innerHTML = this.formatContactPresence(contact);
            this.el.activeStatus.title = this.formatContactPresence(contact);

            if (contact.photo) {
                this.el.activePhoto.src = contact.photo;
                this.el.activePhoto.show();
            } else {
                this.el.activePhoto.hide();
            }
        }
    }

    setActiveChat(contact) {

            if (this._messagesUnsubscribe) {
                this._messagesUnsubscribe();
                this._messagesUnsubscribe = null;
            }

            this._contactActive = contact;
            this._forceScrollMessagesToBottom = true;

            this.el.activeName.innerHTML = contact.name;
            this.el.activeStatus.innerHTML = this.formatContactPresence(contact);
            this.el.activeStatus.title = this.formatContactPresence(contact);

            if (contact.photo) {
                this.el.activePhoto.src = contact.photo;
                this.el.activePhoto.show();
            } else {
                this.el.activePhoto.hide();
            }

            this.el.home.hide();

            this.el.main.css({
                display: 'flex'
            });

            const activeChatId = contact.chatId;

            this._messagesUnsubscribe = Message.getRef(activeChatId)
                .orderBy('timeStamp')
                .onSnapshot(docs => {

            if (!this._contactActive || this._contactActive.chatId !== activeChatId) {
                return;
            }

            let scrollTop = this.el.panelMessagesContainer.scrollTop;
            let autoScroll = this._forceScrollMessagesToBottom || this.isMessagesNearBottom();

            this.el.panelMessagesContainer.innerHTML = '';

            docs.forEach(doc => {

                let data = doc.data();
                data.id = doc.id;

                if (data.type === 'document' && !data.content) return;

                let message = new Message();
                message.fromJSON(data);

                let me = data.from === this._user.email;

                let view = message.getViewElemente(me);

                if (!me && data.status !== 'read') {
                    doc.ref.set({
                        status: 'read'
                    }, {
                        merge: true
                    }).then(() => {

                        return User.getContactsRef(data.from)
                            .doc(btoa(this._user.email))
                            .set({
                                lastMessageStatus: 'read'
                            }, {
                                merge: true
                            });

                    }).then(() => {

                        this.updateLastMessageStatus(this._contactActive, 'read');

                    }).catch(err => {
                        console.error(err);
                    });
                } 

                if (message.type === 'contact') {

                let btn = view.querySelector('.btn-message-send');

                if (btn) {
                    btn.on('click', e => {

                        e.preventDefault();
                        e.stopPropagation();

                        let email = message.content.email;

                        let contactItem = this.el.contactsMessagesList.querySelector(
                            `.contact-item[data-email="${email}"]`
                        );

                        if (contactItem) {
                            contactItem.click();
                            return;
                        }

                        console.error('Contato não encontrado na lista:', email);
                    });
                    }

                }

                if (message.type === 'image') {

                    let image = view.querySelector('.message-photo');

                    if (image) {
                        image.title = 'Abrir imagem';
                        image.addEventListener('click', e => {
                            e.preventDefault();
                            this.openImageViewer(message.content);
                        });
                    }
                }

                    this.el.panelMessagesContainer.appendChild(view);
                });

                if (autoScroll) {
                    this.scrollMessagesToBottom();
                } else {
                    this.el.panelMessagesContainer.scrollTop = scrollTop;
                }

                this._forceScrollMessagesToBottom = false;
            });
    }

    loadElements(){

        this.el = {};

        document.querySelectorAll("[id]").forEach(element=>{

            this.el[format.getCamelCase(element.id)] = element;


        });
    }

    elementsPrototype(){

        Element.prototype.hide = function(){

            this.style.display = "none";
            return this;
        }

        Element.prototype.show = function(){

            this.style.display = "block";
            return this;
        }

        Element.prototype.toggle = function(){

            this.style.display = (this.style.display === "none") ? "block" : "none";
            return this;
        }

        Element.prototype.on = function(events, fn){

            events.split(" ").forEach(event=>{

                this.addEventListener(event, fn);
            });
            return this;
        }

        Element.prototype.css = function(styles){

            for(let name in styles){

                this.style[name] = styles[name];
            }
            return this;
        }

        Element.prototype.addClass = function(name){

            this.classList.add(name);
            return this;
        }

        Element.prototype.removeClass = function(name){

            this.classList.remove(name);
            return this;
        }

        Element.prototype.toggleClass = function(name){

            this.classList.toggle(name);
            return this;
        }

        Element.prototype.hasClass = function(name){

            return this.classList.contains(name);
        }

        HTMLFormElement.prototype.getForm = function () {

            return new FormData(this);
        }

        HTMLFormElement.prototype.toJSON = function () {

            let json = {};

            this.getForm().forEach((value, key)=>{

                json[key] = value;
            });

            return json;
        }
    }

    isMessagesNearBottom(distance = 120) {

        let container = this.el.panelMessagesContainer;
        let scrollTopMax = container.scrollHeight - container.offsetHeight;

        return scrollTopMax <= 0 || container.scrollTop >= scrollTopMax - distance;
    }

    scrollMessagesToBottom() {

        let container = this.el.panelMessagesContainer;
        let scroll = () => {
            container.scrollTop = Math.max(container.scrollHeight - container.offsetHeight, 0);
        };

        scroll();

        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(scroll);
        } else {
            setTimeout(scroll, 0);
        }
    }

    getLastMessagePreview(type, data = {}) {

        switch (type) {

            case 'image':
                return data.count && data.count > 1 ? `${data.count} fotos` : 'Foto';

            case 'document':
                let fileLabel = Message.getFileTypeLabel(data.fileType);
                let filename = data.filename || 'Documento';

                if (!fileLabel && filename.indexOf('.') > -1) {
                    fileLabel = filename.split('.').pop().toUpperCase();
                }

                return fileLabel ? `${fileLabel}: ${filename}` : filename;

            case 'audio':
                return 'Audio';

            case 'contact':
                return data.name ? `Contato: ${data.name}` : 'Contato';

            default:
                return data.text || '';
        }
    }

    updateLastMessageFromType(contact, type, data = {}) {

        this.updateLastMessage(contact, this.getLastMessagePreview(type, data));
    }

    updateLastMessage(contact, text) {
        let now = new Date();

        if (!contact || !contact.email) return;

        this._user.updateContact(contact.email, {
            lastMessage: text,
            lastMessageTime: now,
            lastMessageFrom: this._user.email,
            lastMessageStatus: 'sent'
        }).catch(err => console.error(err));

        User.getContactsRef(contact.email)
            .doc(btoa(this._user.email))
            .set({
            lastMessage: text,
            lastMessageTime: now,
            lastMessageFrom: this._user.email,
            lastMessageStatus: 'sent'
            }, { merge: true })
            .catch(err => console.error(err));
    }

        updateLastMessageStatus(contact, status) {

        if (!contact || !contact.email) return;

        contact.lastMessageStatus = status;

        this.updateRenderedContactProfile(contact);

        return this._user.updateContact(contact.email, {
            lastMessageStatus: status
        }).catch(err => console.error(err));
    }

    openAttachmentPreviewPanel() {

        this.closeAllMainPanel();
        this.el.panelDocumentPreview.addClass("open");
        this.el.panelDocumentPreview.css({
            "height": "calc(100% - 120px)"
        });
    }

    resetAttachmentPreview(clearInputs = true) {

        if (clearInputs) {
            this.el.inputPhoto.value = '';
            this.el.inputDocument.value = '';
        }

        this._mediaPreviewMode = null;
        this._imagePreviewFiles = [];
        this._documentPreviewController = null;
        this.el.imgPanelDocumentPreview.src = '#';
        this.el.infoPanelDocumentPreview.innerHTML = '';
        this.el.filenamePanelDocumentPreview.innerHTML = '';
        this.el.iconPanelDocumentPreview.className = 'jcxhw icon-doc-generic';
        this.el.imagePanelDocumentPreview.hide();
        this.el.filePanelDocumentPreview.hide();
    }

    prepareAttachmentInput(input) {

        this.closeAllMainPanel();
        this.el.panelMessagesContainer.show();
        this.resetAttachmentPreview();
        input.click();
    }

    openImageViewer(src) {

        let viewer = this.getImageViewer();
        let image = viewer.querySelector('.media-image-viewer-image');

        image.src = src;
        viewer.addClass('open');
    }

    closeImageViewer() {

        if (!this._imageViewer) return;

        this._imageViewer.removeClass('open');
        this._imageViewer.querySelector('.media-image-viewer-image').src = '#';
    }

    getImageViewer() {

        if (this._imageViewer) return this._imageViewer;

        let viewer = document.createElement('div');
        viewer.className = 'media-image-viewer';
        viewer.innerHTML = `
            <div class="media-image-viewer-toolbar">
                <button class="media-image-viewer-close" title="Fechar">
                    <span data-icon="x-light">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                            <path fill="#FFF" d="M19.058 17.236l-5.293-5.293 5.293-5.293-1.764-1.764L12 10.178 6.707 4.885 4.942 6.649l5.293 5.293-5.293 5.293L6.707 19 12 13.707 17.293 19l1.765-1.764z"></path>
                        </svg>
                    </span>
                </button>
            </div>
            <div class="media-image-viewer-stage">
                <img src="#" class="media-image-viewer-image">
            </div>
        `;

        viewer.querySelector('.media-image-viewer-close').addEventListener('click', e => {
            e.preventDefault();
            this.closeImageViewer();
        });

        viewer.addEventListener('click', e => {
            if (e.target === viewer || e.target.hasClass && e.target.hasClass('media-image-viewer-stage')) {
                this.closeImageViewer();
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.closeImageViewer();
        });

        document.body.appendChild(viewer);
        this._imageViewer = viewer;

        return viewer;
    }

    initEvents(){

        this.el.inputSearchContacts.on('keyup', e=>{

            if(this.el.inputSearchContacts.value.length > 0) {
                this.el.inputSearchContactsPlaceholder.hide();
            } else {

                this.el.inputSearchContactsPlaceholder.show();
            }

            this._user.getContacts(this.el.inputSearchContacts.value);
            
        });

        this.el.myPhoto.on("click", e=>{

            this.closeAllLeftPanel();
            this.el.panelEditProfile.show();
            setTimeout(()=>{

                this.el.panelEditProfile.addClass("open");
            }, 300);
        });

        this.el.btnNewContact.on("click", e=>{

            this.closeAllLeftPanel();
            this.el.panelAddContact.show();
            setTimeout(()=>{

                this.el.panelAddContact.addClass("open");
            }, 300);
        });

        this.el.btnClosePanelEditProfile.on("click", e=>{

            this.el.panelEditProfile.removeClass("open");
        });

        this.el.btnClosePanelAddContact.on("click", e=>{

            this.el.panelAddContact.removeClass("open");
        });

        this.el.photoContainerEditProfile.on("click", e=>{

            this.el.inputProfilePhoto.click();
        });

        this.el.inputProfilePhoto.on("change", e => {

            if (this.el.inputProfilePhoto.files.length > 0) {

                let file = this.el.inputProfilePhoto.files[0];

                Base64.imageToDataURL(file).then(dataURL => {

                    this._user.photo = dataURL;

                    this._user.save().then(() => {
                        this.el.btnClosePanelEditProfile.click();
                    });

                }).catch(err => {
                    console.error(err);
                    alert("Não foi possível carregar a foto.");
                });
            }
        });

        this.el.inputNamePanelEditProfile.on("keypress", e=>{

            if (e.key === "Enter") {

                e.preventDefault();
                this.el.btnSavePanelEditProfile.click();
            }
        });

        this.el.btnSavePanelEditProfile.on("click", e=>{

            this.el.btnSavePanelEditProfile.disabled = true;

            this._user.name = this.el.inputNamePanelEditProfile.innerHTML;

            this._user.save().then(()=>{

                this.el.btnSavePanelEditProfile.disabled = false;
                this.el.btnClosePanelEditProfile.click();
            });
        });

        this.el.formPanelAddContact.on("submit", e=>{

            e.preventDefault();
            let formData = new FormData(this.el.formPanelAddContact);

            let contact = new User(formData.get('email'));

            contact.ready().then(() => {

                if(contact.name){

                        Chat.createIfNotExists(this._user.email, contact.email).then(chat =>{

                            contact.chatId = chat.id;

                            this._user.chatId = chat.id;

                            contact.addContact(this._user);

                            this._user.addContact(contact).then(()=>{

                            this.el.btnClosePanelAddContact.click();
                            console.info('Contato foi adicionado.');
                        });

                    });

                } else {

                    console.error('Usuário não foi encontrado.');
                }
            }).catch(err => console.error(err));
        });

        this.el.contactsMessagesList.querySelectorAll(".contact-item").forEach(item=>{

            item.on("click", e=>{

                this.el.home.hide();
                this.el.main.css({
                    display: "flex"
                });
            });
        });

        this.el.btnAttach.on("click", e=>{

            e.stopPropagation();
            this.el.menuAttach.addClass("open");
            document.addEventListener("click", this.closeMenuAttach.bind(this));
        });

        this.el.btnAttachPhoto.on("click", e=>{

            this.prepareAttachmentInput(this.el.inputPhoto);
        });

        this.el.inputPhoto.on("change", e=>{

            let files = [...this.el.inputPhoto.files];

            if (!files.length) {
                this.resetAttachmentPreview();
                return;
            }

            this.resetAttachmentPreview(false);
            this._mediaPreviewMode = 'image';
            this._imagePreviewFiles = files;
            this.openAttachmentPreviewPanel();

            this._documentPreviewController = new DocumentPreviewController(files[0]);

            this._documentPreviewController.getPreviewData().then(result => {

                this.el.imgPanelDocumentPreview.src = result.src;
                this.el.infoPanelDocumentPreview.innerHTML = files.length > 1 ? `${files.length} imagens selecionadas` : files[0].name;
                this.el.imagePanelDocumentPreview.show();
                this.el.filePanelDocumentPreview.hide();

            }).catch(err => this.showMediaSendError(err));
        });

        this.el.btnAttachCamera.on("click", e=>{

            this.closeAllMainPanel();
            this.el.panelCamera.addClass("open");
            this.el.panelCamera.css({
                "height":"calc(100% - 120px)"
            });

            this._camera = new CameraController(this.el.videoCamera);
        });

        this.el.btnClosePanelCamera.on("click", e=>{

            this.closeAllMainPanel();
            this.el.panelMessagesContainer.show();
            this._camera.stop();
        });

        this.el.btnTakePicture.on("click", e=>{

            let dataUrl = this._camera.takePicture();

            this.el.pictureCamera.src = dataUrl;
            this.el.pictureCamera.show();
            this.el.videoCamera.hide();
            this.el.btnReshootPanelCamera.show();
            this.el.containerTakePicture.hide();
            this.el.containerSendPicture.show();
        });

        this.el.btnReshootPanelCamera.on("click", e=>{

            this.el.pictureCamera.hide();
            this.el.videoCamera.show();
            this.el.btnReshootPanelCamera.hide();
            this.el.containerTakePicture.show();
            this.el.containerSendPicture.hide();
        });

        this.el.btnSendPicture.on("click", e=>{

            this.el.btnSendPicture.disabled = true;

            let regex = /^data:(.+);base64,(.*)$/;
            let result = this.el.pictureCamera.src.match(regex);

            if (!result) {

                console.error('DataURL inválida:', this.el.pictureCamera.src);
                this.el.btnSendPicture.disabled = false;

            return;
            }

            let mimeType = result[1];
            let ext = mimeType.split('/')[1];
            let filename = `camera${Date.now()}.${ext}`;

            let picture = new Image();
            picture.src = this.el.pictureCamera.src;

            picture.onload = e => {

                let canvas = document.createElement('canvas');
                let context = canvas.getContext('2d');

                canvas.width = picture.width;
                canvas.height = picture.height;

                context.translate(picture.width, 0);
                context.scale(-1, 1);

                context.drawImage(picture, 0, 0, canvas.width, canvas.height);

                fetch(canvas.toDataURL(mimeType))
                .then(res => {
                    return res.arrayBuffer();
                })
                .then(buffer => {
                    return new File([buffer], filename, {
                        type: mimeType
                    });
                })
                .then(file => {

                    return Message.sendImage(
                        this._contactActive.chatId,
                        this._user.email,
                        file
                    );
                })
                .then(() => {

                    this.updateLastMessageFromType(this._contactActive, 'image');

                    this.el.btnSendPicture.disabled = false;

                    this.closeAllMainPanel();
                    this._camera.stop();
                    this.el.btnReshootPanelCamera.hide();
                    this.el.pictureCamera.hide();
                    this.el.videoCamera.show();
                    this.el.containerSendPicture.hide();
                    this.el.containerTakePicture.show();
                    this.el.panelMessagesContainer.show();

                }).catch(err => {

                    this.el.btnSendPicture.disabled = false;
                    this.showMediaSendError(err);

                });
            }

        });

        this.el.btnAttachDocument.on("click", e=>{

            this.prepareAttachmentInput(this.el.inputDocument);
        });

        this.el.inputDocument.on("change", e => {

            if (this.el.inputDocument.files.length) {

                let file = this.el.inputDocument.files[0];

                this.resetAttachmentPreview(false);
                this.openAttachmentPreviewPanel();

                if (file.type.startsWith('image/')) {
                    this._mediaPreviewMode = 'image';
                    this._imagePreviewFiles = [file];
                } else {
                    this._mediaPreviewMode = 'document';
                }

                this._documentPreviewController = new DocumentPreviewController(file);

                this._documentPreviewController.getPreviewData().then(result => {

                    this.el.imgPanelDocumentPreview.src = result.src;

                    if (file.type.startsWith('image/')) {
                        this.el.infoPanelDocumentPreview.innerHTML = file.name;
                    } else {
                        this.el.infoPanelDocumentPreview.innerHTML = result.info;
                    }

                    this.el.imagePanelDocumentPreview.show();
                    this.el.filePanelDocumentPreview.hide();

                    this.el.panelDocumentPreview.css({
                        "height": "calc(100% - 120px)"
                    });

                }).catch(err => {

                    this.el.panelDocumentPreview.css({
                        "height": "calc(100% - 120px)"
                    });

                    switch (file.type) {

                        case 'image/jpeg':
                        case 'image/jpg':
                        case 'image/png':
                        case 'image/gif':
                        case 'image/webp':
                            this.el.iconPanelDocumentPreview.className = 'jcxhw icon-doc-generic';
                            break;

                        case 'application/vnd.ms-excel':
                        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                            this.el.iconPanelDocumentPreview.className = 'jcxhw icon-doc-xls';
                            break;

                        case 'application/vnd.ms-powerpoint':
                        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                            this.el.iconPanelDocumentPreview.className = 'jcxhw icon-doc-ppt';
                            break;

                        case 'application/msword':
                        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                            this.el.iconPanelDocumentPreview.className = 'jcxhw icon-doc-doc';
                            break;

                        case 'application/pdf':
                            this.el.iconPanelDocumentPreview.className = 'jcxhw icon-doc-pdf';
                            break;

                        default:
                            this.el.iconPanelDocumentPreview.className = 'jcxhw icon-doc-generic';
                            break;
                    }

                    this.el.filenamePanelDocumentPreview.innerHTML = file.name;
                    this.el.imagePanelDocumentPreview.hide();
                    this.el.filePanelDocumentPreview.show();
                });
            } else {
                this.resetAttachmentPreview();
            }
        });

        this.el.btnClosePanelDocumentPreview.on("click", e=>{

            this.closeAllMainPanel();
            this.el.panelMessagesContainer.show();
            this.resetAttachmentPreview();

        });

        this.el.btnSendDocument.on('click', e => {

            if (this._mediaPreviewMode === 'image') {

                let files = this._imagePreviewFiles || [];

                if (!files.length) return;

                Promise.all(files.map(file => {
                    return Message.sendImage(this._contactActive.chatId, this._user.email, file);
                })).then(() => {
                    this.updateLastMessageFromType(this._contactActive, 'image', {
                        count: files.length
                    });
                    this.el.btnClosePanelDocumentPreview.click();
                }).catch(err => this.showMediaSendError(err));
                return;
            }

            let file = this.el.inputDocument.files[0];

            if (!file) return;

            let base64 = this.el.imgPanelDocumentPreview.src;
            let hasPreview = base64 && base64.indexOf('data:') === 0;
            let info = file.type === 'application/pdf' ? this.el.infoPanelDocumentPreview.innerHTML : '';
            let sendDocument = (filePreview = null) => {
                return Message.sendDocument(
                    this._contactActive.chatId,
                    this._user.email,
                    file,
                    filePreview,
                    info
                );
            };
            let sendPromise;

            if (file.type === 'application/pdf' && hasPreview) {
                sendPromise = sendDocument(base64);
            } else {
                sendPromise = sendDocument();
            }

            sendPromise.then(() => {
                this.updateLastMessageFromType(this._contactActive, 'document', {
                    filename: file.name,
                    fileType: file.type
                });
            }).catch(err => this.showMediaSendError(err));
            this.el.inputDocument.value = '';
            this.el.btnClosePanelDocumentPreview.click();

        });

        this.el.btnAttachContact.on("click", e=>{

            this._contactsController = new ContactsController(this.el.modalContacts, this._user);

            this._contactsController.on('select', contact => {

                Message.sendContact(
                    this._contactActive.chatId,
                    this._user.email,
                    contact
                ).then(() => {
                    this.updateLastMessageFromType(this._contactActive, 'contact', contact);
                }).catch(err => this.showMediaSendError(err));
            });

            this._contactsController.open();
        });

        this.el.btnCloseModalContacts.on("click", e=>{

            this._contactsController.close();
        });

        this.el.btnSendMicrophone.on("click", e=>{

            this.el.recordMicrophone.show();
            this.el.btnSendMicrophone.hide();

            this._microphoneController = new MicrophoneController();

            this._microphoneController.on("ready", stream=>{

                this._microphoneController.startRecorder();

            });

            this._microphoneController.on("recordtimer", timer =>{

                    let seconds = Math.floor(timer / 1000);
                    let minutes = Math.floor(seconds / 60);

                    seconds = seconds % 60;

                    this.el.recordMicrophoneTimer.innerHTML =
                        `${minutes}:${seconds.toString().padStart(2, "0")}`;

                });

            });

            this.el.btnCancelMicrophone.on("click", e=>{

                if (this._microphoneController) {

                    this._microphoneController.stopRecorder();

                }

                this.closeRecordMicrophone();

            });

            this.el.btnFinishMicrophone.on("click", e=>{

                if (!this._microphoneController) return;

            this._microphoneController.on('recorded', (file, metadata)=>{

                Message.sendAudio(
                    this._contactActive.chatId,
                    this._user.email,
                    file,
                    metadata,
                    this._user.photo
                ).then(() => {
                    this.updateLastMessageFromType(this._contactActive, 'audio');
                }).catch(err => this.showMediaSendError(err));

                this.closeRecordMicrophone();

            });

            this._microphoneController.stopRecorder();

        });

        this.el.inputText.on("keypress", e => {

            if (e.key === "Enter" && !e.ctrlKey){

                e.preventDefault();
                this.el.btnSend.click();
            }
        });

        this.el.inputText.on("keyup", e => {

        if (
            this.el.inputText.innerText.trim().length > 0 ||
            this.el.inputText.querySelectorAll("img").length > 0
        ) {

            this.el.inputPlaceholder.hide();
            this.el.btnSendMicrophone.hide();
            this.el.btnSend.show();

            } else {

                this.el.inputPlaceholder.show();
                this.el.btnSendMicrophone.show();
                this.el.btnSend.hide();
            }
        });

        this.el.btnSend.on("click", e => {

            let text = this.el.inputText.innerHTML.trim();

            if (!text) return;

            Message.send(
                this._contactActive.chatId,
                this._user.email,
                "text",
                text
            )
            .then(() => {
                this.updateLastMessage(this._contactActive, text);
            })
            .then(() => {
                this.el.inputText.innerHTML = "";
                this.el.panelEmojis.removeClass("open");
                this.el.inputPlaceholder.show();
                this.el.btnSend.hide();
                this.el.btnSendMicrophone.show();
            })
            .catch(err => {
                console.error("Erro ao enviar mensagem:", err);
            });

        });

        this.el.btnEmojis.on("click", e=>{

            this.el.panelEmojis.toggleClass("open");
        });

        this.el.panelEmojis.querySelectorAll(".emojik").forEach(emoji=>{

            emoji.on("click", e=>{

                let img = this.el.imgEmojiDefault.cloneNode();

                img.style.cssText = emoji.style.cssText;
                img.dataset.unicode = emoji.dataset.unicode;
                img.alt = emoji.dataset.unicode;

                emoji.classList.forEach(name=>{
                    img.classList.add(name);
                });

                let cursor = window.getSelection();

                if(!cursor.focusNode || cursor.focusNode.id == "input-text") {
                    this.el.inputText.focus();
                    cursor = window.getSelection();
                }

                let range = document.createRange();

                range = cursor.getRangeAt(0);
                range.deleteContents();

                let frag = document.createDocumentFragment();

                frag.appendChild(img);

                range.insertNode(frag);

                range.setStartAfter(img);

                this.el.inputText.dispatchEvent(new Event("keyup"));
            });
        });

    }

    startRecordMicrophoneTime() {

        this._microphoneController = new MicrophoneController();

        this._microphoneController.on('ready', event => {

            this._microphoneController.startRecorder();

        });

        this._microphoneController.on('timer', (data, event) => {

            this.el.recordMicrophoneTimer.innerHTML = data.displayTimer;

        });

    }

    closeRecordMicrophone() {

        this._microphoneController.stopRecorder();

        this.el.recordMicrophone.hide();
        this.el.btnSendMicrophone.show();

    }

    showMediaSendError(err){

        console.error('Erro ao enviar midia:', err);
        alert(err.message || 'Nao foi possivel enviar a midia.');
    }

    closeAllMainPanel(){

        this.el.panelMessagesContainer.hide();
        this.el.panelDocumentPreview.removeClass("open");
        this.el.panelCamera.removeClass("open");
    }

    closeMenuAttach(e){

        document.removeEventListener("click", this.closeMenuAttach);
        this.el.menuAttach.removeClass("open");
    }

    closeAllLeftPanel(){

        this.el.panelAddContact.hide();
        this.el.panelEditProfile.hide();
    }
}
