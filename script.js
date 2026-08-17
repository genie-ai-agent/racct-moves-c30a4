(function () {
  var D = window.RACCT;
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- marquee ---------- */
  var chunk = D.marquee.map(function (m) { return m + ' <i>\u2726</i> '; }).join('');
  $('#marquee').innerHTML = '<span>' + chunk + '</span><span>' + chunk + '</span>';

  /* ---------- what we move ---------- */
  $('#haulGrid').innerHTML = D.haul.map(function (c) {
    return '<article class="card ' + c.color + '">' +
      '<span class="num">' + c.n + '</span>' +
      '<h3>' + c.title + '</h3>' +
      '<p>' + c.body + '</p>' +
      '<ul>' + c.tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
      '</article>';
  }).join('');

  /* ---------- timeline ---------- */
  $('#timeline').innerHTML = D.timeline.map(function (s) {
    return '<li><span class="t">' + s.t + '</span><h3>' + s.h + '</h3><p>' + s.b + '</p></li>';
  }).join('');

  /* ---------- palace ---------- */
  $('#palaceGrid').innerHTML = D.palace.map(function (p) {
    return '<div class="pal"><h3>' + p.h + '</h3><p>' + p.b + '</p></div>';
  }).join('');

  /* ---------- live ledger reveal ---------- */
  var money = function (n) { return '$' + n.toLocaleString('en-US'); };
  var list = $('#ledgerList');
  var totalEl = $('#ledgerTotal');
  list.innerHTML = D.ledger.map(function (r) {
    return '<li><span class="item">' + r.item + '<span class="note">' + r.note + '</span></span>' +
      '<span class="price' + (r.toss ? ' toss' : '') + '">' + (r.toss ? 'JUNK TRUCK' : money(r.price)) + '</span></li>';
  }).join('');

  var rows = Array.prototype.slice.call(list.children);
  var target = D.ledger.reduce(function (a, r) { return a + r.price; }, 0);
  var played = false;

  function countUp(to) {
    var start = performance.now(), dur = 900;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur);
      totalEl.textContent = money(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  function playLedger() {
    if (played) return;
    played = true;
    rows.forEach(function (li, i) {
      setTimeout(function () { li.classList.add('in'); }, i * 190);
    });
    setTimeout(function () { countUp(target); }, rows.length * 190 + 120);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) playLedger(); });
    }, { threshold: 0.25 });
    io.observe($('.ledger'));
  } else {
    playLedger();
  }

  /* ---------- estimator ---------- */
  var BASE = { studio: 690, '1br': 980, '2br': 1480, '3br': 2150, '4br': 3050 };
  var DIST = { local: 1, regional: 1.55, long: 2.6 };
  var JUNK = { none: 0, some: 340, lots: 780 };
  var LABEL = {
    studio: 'Studio / 1 room', '1br': '1 bedroom', '2br': '2 bedrooms', '3br': '3 bedrooms', '4br': '4+ bedrooms',
    local: 'across town', regional: 'same state', long: 'cross country',
    none: 'no junk removal', some: 'a few rooms of junk', lots: 'garage + basement junk'
  };

  var f = {
    size: $('#size'), distance: $('#distance'), junk: $('#junk'),
    pack: $('#pack'), organize: $('#organize'), appraise: $('#appraise'), storage: $('#storage')
  };

  function calc() {
    var base = BASE[f.size.value] * DIST[f.distance.value];
    var add = JUNK[f.junk.value];
    var extras = [];
    if (f.pack.checked) { base *= 1.22; extras.push('full pack & wrap'); }
    if (f.organize.checked) { add += 420; extras.push('unpack & organize'); }
    if (f.appraise.checked) { extras.push('real-time pricing & resale credit'); }
    if (f.storage.checked) { add += 295; extras.push('30 days storage'); }

    var mid = base + add;
    var lo = Math.round(mid * 0.9 / 25) * 25;
    var hi = Math.round(mid * 1.14 / 25) * 25;

    $('#estRange').textContent = money(lo) + '\u2013' + money(hi);
    $('#estNote').textContent = f.appraise.checked
      ? 'Crew, truck, fuel and disposal included. Resale credits come off this number on move day.'
      : 'Crew, truck, fuel and disposal fees included.';

    var body = 'Move day request\n\n' +
      'Home: ' + LABEL[f.size.value] + '\n' +
      'Distance: ' + LABEL[f.distance.value] + '\n' +
      'Junk: ' + LABEL[f.junk.value] + '\n' +
      'Add-ons: ' + (extras.length ? extras.join(', ') : 'none') + '\n' +
      'Estimate shown: ' + money(lo) + '\u2013' + money(hi) + '\n\n' +
      'My move date is: \nFrom address: \nTo address: \nPhone: \n';

    $('#estMail').href = 'mailto:movers@racct.com?subject=' +
      encodeURIComponent('RACCT move day \u2014 ' + LABEL[f.size.value] + ', ' + LABEL[f.distance.value]) +
      '&body=' + encodeURIComponent(body);
  }

  Object.keys(f).forEach(function (k) { f[k].addEventListener('change', calc); });
  calc();

  /* ---------- faq ---------- */
  $('#faqList').innerHTML = D.faq.map(function (x, i) {
    return '<div class="qa"><button type="button" aria-expanded="false" aria-controls="a' + i + '">' + x.q + '</button>' +
      '<div class="a" id="a' + i + '"><p>' + x.a + '</p></div></div>';
  }).join('');

  Array.prototype.forEach.call(document.querySelectorAll('.qa button'), function (b) {
    b.addEventListener('click', function () {
      var qa = b.parentElement, panel = qa.querySelector('.a');
      var open = qa.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    });
  });

  $('#year').textContent = new Date().getFullYear();
})();
