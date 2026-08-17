(function () {
  var D = window.RACCT;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var money = function (n) { return '$' + n.toLocaleString('en-US'); };

  /* ---------- what we move ---------- */
  $('#tiles').innerHTML = D.haul.map(function (c) {
    return '<article class="tile reveal">' +
      '<span class="num">' + c.n + '</span>' +
      '<h3>' + c.title + '</h3>' +
      '<p>' + c.body + '</p>' +
      '<ul>' + c.tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
      '</article>';
  }).join('');

  /* ---------- timeline ---------- */
  $('#timeline').innerHTML = D.timeline.map(function (s) {
    return '<li class="reveal"><span class="t">' + s.t + '</span><h3>' + s.h + '</h3><p>' + s.b + '</p></li>';
  }).join('');

  /* ---------- palace ---------- */
  $('#palaceGrid').innerHTML = D.palace.map(function (p) {
    return '<div class="pal"><h3>' + p.h + '</h3><p>' + p.b + '</p></div>';
  }).join('');

  /* ---------- ledger ---------- */
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
    rows.forEach(function (li, i) { setTimeout(function () { li.classList.add('in'); }, i * 170); });
    setTimeout(function () { countUp(target); }, rows.length * 170 + 100);
  }

  /* ---------- scroll reveal ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i, 4) * 60) + 'ms';
      io.observe(el);
    });

    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) playLedger(); });
    }, { threshold: 0.25 });
    lio.observe($('.ledger'));
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
    playLedger();
  }

  /* ---------- estimator ---------- */
  var BASE = { studio: 690, '1br': 980, '2br': 1480, '3br': 2150, '4br': 3050 };
  var DIST = { local: 1, regional: 1.55, long: 2.6 };
  var JUNK = { none: 0, some: 340, lots: 780 };
  var LABEL = {
    studio: 'studio', '1br': '1 bedroom', '2br': '2 bedrooms', '3br': '3 bedrooms', '4br': '4+ bedrooms',
    local: 'across town', regional: 'same state', long: 'cross country',
    none: 'no junk removal', some: 'a few rooms of junk', lots: 'garage + basement junk',
    pack: 'full pack and wrap', organize: 'unpack and organize',
    appraise: 'real-time pricing', storage: '30 days storage'
  };

  var state = { size: '2br', distance: 'long', junk: 'some', pack: true, organize: true, appraise: true, storage: false };

  function calc() {
    var base = BASE[state.size] * DIST[state.distance];
    var add = JUNK[state.junk];
    var extras = [];
    if (state.pack) { base *= 1.22; extras.push(LABEL.pack); }
    if (state.organize) { add += 420; extras.push(LABEL.organize); }
    if (state.appraise) { extras.push(LABEL.appraise); }
    if (state.storage) { add += 295; extras.push(LABEL.storage); }

    var mid = base + add;
    var lo = Math.round(mid * 0.9 / 25) * 25;
    var hi = Math.round(mid * 1.14 / 25) * 25;

    $('#estRange').textContent = money(lo) + '\u2013' + money(hi);
    $('#estNote').textContent = state.appraise
      ? 'Crew, truck, fuel, and disposal included. Resale credits come off this number.'
      : 'Crew, truck, fuel, and disposal included.';

    var body = 'Move day request\n\n' +
      'Home: ' + LABEL[state.size] + '\n' +
      'Distance: ' + LABEL[state.distance] + '\n' +
      'Junk: ' + LABEL[state.junk] + '\n' +
      'Add-ons: ' + (extras.length ? extras.join(', ') : 'none') + '\n' +
      'Estimate shown: ' + money(lo) + '\u2013' + money(hi) + '\n\n' +
      'Move date: \nFrom: \nTo: \nPhone: \n';

    $('#estMail').href = 'mailto:movers@racct.com?subject=' +
      encodeURIComponent('RACCT move day \u2014 ' + LABEL[state.size] + ', ' + LABEL[state.distance]) +
      '&body=' + encodeURIComponent(body);
  }

  $$('.seg').forEach(function (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      state[seg.dataset.key] = b.dataset.val;
      calc();
    });
  });

  function toggle(sw) {
    var on = sw.classList.toggle('on');
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    state[sw.dataset.key] = on;
    calc();
  }

  $$('.sw').forEach(function (sw) {
    sw.addEventListener('click', function () { toggle(sw); });
    sw.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(sw); }
    });
  });

  calc();

  /* ---------- faq ---------- */
  $('#faqList').innerHTML = D.faq.map(function (x, i) {
    return '<div class="qa"><button type="button" aria-expanded="false" aria-controls="a' + i + '">' + x.q + '</button>' +
      '<div class="a" id="a' + i + '"><p>' + x.a + '</p></div></div>';
  }).join('');

  $$('.qa button').forEach(function (b) {
    b.addEventListener('click', function () {
      var qa = b.parentElement, panel = qa.querySelector('.a');
      var open = qa.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    });
  });

  $('#year').textContent = new Date().getFullYear();
})();
