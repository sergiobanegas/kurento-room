import { KurentoRoomBasicappPage } from './app.po';

describe('kurento-room-basicapp App', function() {
  let page: KurentoRoomBasicappPage;

  beforeEach(() => {
    page = new KurentoRoomBasicappPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('kurento-room-basicapp works!');
  });
});
