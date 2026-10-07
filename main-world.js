// Runs in the page's own JS world (content scripts cannot see page-created shadow roots as
// they happen). Marks every shadow host so content.js can adopt roots attached late, such as
// custom elements upgraded after their script loads asynchronously.
(() => {
  const proto = Element.prototype;
  const original = proto.attachShadow;
  if (!original || original.__sdmPatched) return;

  function attachShadow(init) {
    const shadowRoot = original.call(this, init);
    try {
      this.setAttribute('data-sdm-host', '');
    } catch (e) {}
    return shadowRoot;
  }
  attachShadow.__sdmPatched = true;
  Object.defineProperty(attachShadow, 'toString', { value: () => original.toString() });

  Object.defineProperty(proto, 'attachShadow', {
    value: attachShadow,
    writable: true,
    configurable: true
  });
})();
