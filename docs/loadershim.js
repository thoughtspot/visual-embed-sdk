global.___loader = {
  enqueue: jest.fn(),
}
global.document.execCommand = function () {
  //no-op
}
