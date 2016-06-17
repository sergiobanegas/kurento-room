import { Ng3Page } from './app.po';

describe('ng3 App', function() {
  let page: Ng3Page;

  beforeEach(() => {
    page = new Ng3Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
