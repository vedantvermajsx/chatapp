(function () {
  var script = document.currentScript || Array.prototype.slice.call(document.scripts).filter(function (s) {
    return /embed\.js(\?|$)/.test(s.src);
  }).pop();
  if (!script) return;

  var base = new URL(script.src, location.href).origin;
  var holders = Array.prototype.slice.call(document.querySelectorAll('[data-chess-embed]'));

  if (!holders.length) {
    var holder = document.createElement('div');
    script.parentNode.insertBefore(holder, script);
    holders.push(holder);
  }

  holders.forEach(function (holder) {
    var fixedHeight = holder.getAttribute('data-height');
    var maxWidth = holder.getAttribute('data-max-width') || '640px';

    var iframe = document.createElement('iframe');
    iframe.src = base + '/start-chess?embed=1';
    iframe.title = 'Chess';
    iframe.allow = 'clipboard-write; fullscreen';
    if (!fixedHeight) iframe.setAttribute('scrolling', 'no');
    iframe.style.cssText =
      'display:block;width:100%;max-width:' + maxWidth + ';margin:0 auto;border:0;border-radius:12px;height:' +
      (fixedHeight || '620px') + ';';

    window.addEventListener('message', function (e) {
      if (e.source !== iframe.contentWindow || fixedHeight) return;
      var d = e.data;
      if (d && d.type === 'chess-embed:height' && typeof d.height === 'number') {
        iframe.style.height = Math.ceil(d.height) + 'px';
      }
    });

    holder.appendChild(iframe);
  });
})();
