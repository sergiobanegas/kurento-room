export class KurentoRoomBasicappPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('kurento-room-basicapp-app h1')).getText();
  }
}
