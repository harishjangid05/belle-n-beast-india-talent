/* Belle N Beast India Talent Hunt 2027.
   The application form lives in a popup (#apply-modal), opened by every "apply" link.
   Its ₹850 fee is paid via Razorpay: orders are created and verified server-side by
   netlify/functions/create-order.js and verify-payment.js (no secret key in this file).
   The only network calls are to those two functions and Razorpay Checkout; the only
   browser storage is the confirmed registration (so the ID survives a reload).
   The enquiry form only opens the visitor's own email app / WhatsApp with a pre-filled message. */
(() => {
  'use strict';

  const CITIES = [
    ['Mumbai','Maharashtra'],['Delhi','Delhi'],['Bengaluru','Karnataka'],
    ['Hyderabad','Telangana'],['Chennai','Tamil Nadu'],['Kolkata','West Bengal'],
    ['Pune','Maharashtra'],['Ahmedabad','Gujarat'],['Jaipur','Rajasthan'],
    ['Chandigarh','Chandigarh'],['Lucknow','Uttar Pradesh'],['Indore','Madhya Pradesh'],
    ['Surat','Gujarat'],['Bhopal','Madhya Pradesh'],['Kochi','Kerala'],
    ['Panaji','Goa'],['Nagpur','Maharashtra'],['Guwahati','Assam'],
    ['Bhubaneswar','Odisha'],['Coimbatore','Tamil Nadu']
  ];
  const CATEGORY_NAMES = {
    models:'Models',designers:'Fashion Designer',
    creators:'Photographer / Videographer',beauty:'Beautician'
  };
  const q = (selector, root=document) => root.querySelector(selector);
  const qa = (selector, root=document) => [...root.querySelectorAll(selector)];

  // Navigation
  const navButton = q('.menu-toggle');
  const nav = q('#main-nav');
  function closeMenu() {
    nav.classList.remove('open');
    navButton.setAttribute('aria-expanded','false');
    navButton.setAttribute('aria-label','Open navigation');
    document.body.classList.remove('nav-open');
  }
  navButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navButton.setAttribute('aria-expanded', String(open));
    navButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('nav-open', open);
  });
  qa('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });


  // City tiles: the cities and dates are confirmed; venues and times are NOT.
  // Clicking a tile opens the application popup with that city preselected.
  const cityGrid = q('#city-grid');
  function addCityTile(name,state,index) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'city-tile';
    const n = document.createElement('span');
    n.textContent = String(index+1).padStart(2,'0') + ' / 20';
    const title = document.createElement('strong');
    title.textContent = name;
    const sub = document.createElement('small');
    sub.textContent = `${state} · Venue TBD · Jan 01–07`;
    tile.append(n,title,sub);
    tile.setAttribute('aria-label',`Choose ${name} as your preferred audition city`);
    tile.addEventListener('click', () => {
      // City selection is only a form preference, not a booking.
      window.openApplication?.(tile, { city: name });
    });
    return tile;
  }
  function renderCities(term='') {
    cityGrid.replaceChildren();
    let count=0;
    for (const [index,[name,state]] of CITIES.entries()) {
      if (`${name} ${state}`.toLowerCase().includes(term.trim().toLowerCase())) {
        cityGrid.append(addCityTile(name,state,index));count++;
      }
    }
    if (!count) {
      const empty=document.createElement('p');empty.className='city-empty';
      empty.textContent='No city matches that search. Try another city or state.';
      cityGrid.append(empty);
    }
    q('#city-count').textContent=`${count} ${count===1?'CITY':'CITIES'}`;
  }
  renderCities();
  q('#city-search').addEventListener('input', event => renderCities(event.target.value));


  // Category-specific fields are recreated safely without injecting any applicant text.
  const DYNAMIC_QUESTIONS = {
    models: [
      {type:'select',label:'Modelling profile',name:'modelProfile',options:['Female model','Male model','Other / prefer to specify']},
      {type:'select',label:'Preferred modelling work',name:'modelWork',options:['Fashion / editorial','Runway','E-commerce / product','Commercial / video ads','Open to all']},
      {type:'number',label:'Height (cm)',name:'height',min:'100',max:'230',placeholder:'e.g. 175'},
      {type:'url',label:'Model portfolio / Instagram URL',name:'modelPortfolio',placeholder:'https://'}
    ],
    designers: [
      {type:'select',label:'Area of specialisation',name:'designSpecialisation',options:['Fashion apparel','Couture / occasion wear','Pattern making','Styling / creative direction','Other']},
      {type:'text',label:'Design tools / software',name:'designTools',placeholder:'Illustrator, CLO 3D, hand sketching, etc.'},
      {type:'url',label:'Design portfolio URL',name:'designPortfolio',placeholder:'https://'}
    ],
    creators: [
      {type:'select',label:'Primary role',name:'creatorRole',options:['Photographer','Videographer','Both']},
      {type:'select',label:'Primary specialisation',name:'creatorSpecialisation',options:['Fashion photography','Product / e-commerce','Commercial video','Events','Editing / post-production','Other']},
      {type:'text',label:'Camera / editing tools',name:'creatorTools',placeholder:'Camera, Premiere Pro, DaVinci Resolve, etc.'},
      {type:'url',label:'Showreel / work URL',name:'creatorReel',placeholder:'https://'}
    ],
    beauty: [
      {type:'select',label:'Primary beauty skill',name:'beautySkill',options:['Makeup artistry','Hair styling','Skin / beauty services','Nails','Multi-skilled','Other']},
      {type:'text',label:'Training or certifications',name:'beautyTraining',placeholder:'Course, academy or certification (if any)'},
      {type:'text',label:'Practical kit / tools experience',name:'beautyKit',placeholder:'Products or techniques you regularly use'},
      {type:'url',label:'Beauty portfolio URL',name:'beautyPortfolio',placeholder:'https://'}
    ]
  };
  const copyrightYear=q('#copyright-year');
  copyrightYear.textContent='2026';

  // ===== Enquiry form (Belle N Beast India form design) =====
  // Nothing is sent from this page: the enquiry is handed to the visitor's own
  // email app (mailto) or WhatsApp, and they choose whether to send it.
  (() => {
    const ENQ_EMAIL = 'harishjangid0005@gmail.com';
    const ENQ_WHATSAPP = '917073750190';
    const enq = q('#enquiry-form');
    if (!enq) return;
    const success = q('#enquiry-success');
    const errBox = q('.enq-error', enq);
    const citySel = q('#e-city');
    CITIES.forEach(([city, state]) => {
      const o = document.createElement('option');
      o.value = city; o.textContent = `${city}, ${state}`;
      citySel.append(o);
    });
    const other = document.createElement('option');
    other.value = 'Other / not listed'; other.textContent = 'Other / not listed';
    citySel.append(other);

    const setErr = (field, msg) => {
      field.classList.add('is-invalid');
      let m = q('.enq-field__error', field);
      if (!m) { m = document.createElement('span'); m.className = 'enq-field__error'; field.append(m); }
      m.textContent = msg;
    };
    const clearErr = (field) => {
      field.classList.remove('is-invalid');
      q('.enq-field__error', field)?.remove();
    };

    function validateEnquiry() {
      let firstBad = null;
      const el = enq.elements;
      const checks = [
        [el.fullName, el.fullName.value.trim().length >= 2, 'Please enter your full name'],
        [el.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.email.value.trim()), 'Please enter a valid email address'],
        [el.phone, el.phone.value.replace(/\D/g, '').length >= 10, 'Please enter a valid WhatsApp number'],
        [q('[data-group="topic"]', enq), !!enq.querySelector('input[name="topic"]:checked'), 'Please choose what your enquiry is about'],
        [el.message, el.message.value.trim().length >= 20, 'Please write at least 20 characters'],
        [el.consent, el.consent.checked, 'Please agree so we can respond to your enquiry']
      ];
      checks.forEach(([node, ok, msg]) => {
        const field = node.classList?.contains('enq-field') ? node : node.closest('.enq-field');
        if (ok) { clearErr(field); return; }
        setErr(field, msg);
        if (!firstBad) firstBad = node.matches?.('[data-group]') ? q('input', node) : node;
      });
      if (firstBad) {
        errBox.textContent = 'Please check the highlighted fields and try again.';
        errBox.hidden = false;
        firstBad.focus({ preventScroll: true });
        firstBad.closest('.enq-field').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      errBox.hidden = true;
      return true;
    }

    function enquiryLines() {
      const el = enq.elements;
      return [
        `Name: ${el.fullName.value.trim()}`,
        `Email: ${el.email.value.trim()}`,
        `WhatsApp: ${el.phone.value.trim()}`,
        `City: ${el.city.value || 'Not specified'}`,
        `Topic: ${enq.querySelector('input[name="topic"]:checked').value}`,
        '',
        el.message.value.trim()
      ];
    }

    enq.addEventListener('submit', (event) => {
      event.preventDefault();
      if (enq.elements.website.value) return; // honeypot
      if (!validateEnquiry()) return;
      const subject = `${enq.dataset.subject} — ${enq.querySelector('input[name="topic"]:checked').value}`;
      window.location.href = `mailto:${ENQ_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(enquiryLines().join('\n'))}`;
      enq.hidden = true;
      success.hidden = false;
    });

    q('#enquiry-wa').addEventListener('click', () => {
      if (!validateEnquiry()) return;
      const text = ['Hello Belle N Beast, I have an enquiry about the India Talent Hunt 2027.', '', ...enquiryLines()].join('\n');
      window.open(`https://wa.me/${ENQ_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });

    q('#enquiry-reset').addEventListener('click', () => {
      enq.reset();
      qa('.enq-field', enq).forEach(clearErr);
      errBox.hidden = true;
      success.hidden = true;
      enq.hidden = false;
      enq.elements.fullName.focus();
    });

    enq.addEventListener('input', (e) => {
      const field = e.target.closest('.enq-field');
      if (field?.classList.contains('is-invalid')) clearErr(field);
    });
    enq.addEventListener('change', (e) => {
      const field = e.target.closest('.enq-field');
      if (field?.classList.contains('is-invalid')) clearErr(field);
    });
  })();

  // ===== Application popup (Belle N Beast India modal design) =====
  // Opened from the header "Start application" button. Same steps, questions and
  // rules as the #apply form below, but fully separate (own IDs/classes) so the
  // bottom form is untouched. Frontend preview only: nothing leaves the browser.
  (() => {
    const modal = q('#apply-modal');
    if (!modal) return;
    const panel = q('.bnm__panel', modal);
    const mform = q('#bnm-form');
    const steps = qa('[data-bnm-step]', mform);
    const stepper = qa('.bnm-steps li', modal);
    const head = q('[data-bnm-head]', modal);
    const errBox = q('#bnm-error');
    const backBtn = q('#bnm-back');
    const nextLabel = q('#bnm-next-label');
    const done = q('#bnm-done');
    const EVENT_LAST = '2027-01-07';
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let step = 1;
    let lastTrigger = null;
    let closeTimer = null;
    let files = [];

    // ---- open / close (slow, smooth) ----
    function openModal(trigger) {
      lastTrigger = trigger || document.activeElement;
      clearTimeout(closeTimer);
      if (typeof closeMenu === 'function') closeMenu();
      modal.hidden = false;
      document.body.classList.add('bnm-lock');
      void modal.offsetWidth; // let the hidden->visible change paint before animating
      modal.classList.add('is-open');
      setTimeout(() => panel.focus({ preventScroll: true }), 60);
    }
    function closeModal() {
      if (modal.hidden || paying) return;
      modal.classList.remove('is-open');
      closeTimer = setTimeout(() => {
        modal.hidden = true;
        document.body.classList.remove('bnm-lock');
        lastTrigger?.focus?.({ preventScroll: true });
      }, reduced() ? 0 : 900);
    }
    // Every "apply" link on the page opens the popup.
    qa('[data-open-apply], a[href="#apply"]').forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn);
    }));
    // Used by the city tiles: open the popup with a city already chosen.
    window.openApplication = (trigger, opts = {}) => {
      if (opts.city) q('#bnm-ecity').value = opts.city;
      openModal(trigger);
    };
    if (location.hash === '#apply') openModal(null);
    qa('[data-bnm-close]', modal).forEach(btn => btn.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;
      const f = qa('a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select,textarea,[tabindex="0"]', panel)
        .filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // ---- city options ----
    const ecity = q('#bnm-ecity');
    CITIES.forEach(([name, state]) => {
      const o = document.createElement('option');
      o.value = name; o.textContent = `${name}${name === state ? '' : ', ' + state}`;
      ecity.append(o);
    });

    // ---- profession-specific questions (same set as the main form) ----
    const roleBox = q('#bnm-role');
    const roleFields = q('#bnm-role-fields');
    function renderRole(category) {
      roleFields.replaceChildren();
      const specs = DYNAMIC_QUESTIONS[category] || [];
      roleBox.hidden = !specs.length;
      q('#bnm-role-title').textContent = specs.length ? `${CATEGORY_NAMES[category]} — profile questions` : '';
      specs.forEach((spec, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'enq-field' + (spec.type === 'url' ? ' full' : '');
        const id = `bnm-dyn-${i}`;
        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = spec.label + ' ';
        const opt = document.createElement('span'); opt.className = 'enq-opt'; opt.textContent = '(optional)';
        label.append(opt);
        let field;
        if (spec.type === 'select') {
          field = document.createElement('select');
          const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'Select'; field.append(blank);
          spec.options.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; field.append(o); });
        } else {
          field = document.createElement('input');
          field.type = spec.type;
          if (spec.placeholder) field.placeholder = spec.placeholder;
          if (spec.min) field.min = spec.min;
          if (spec.max) field.max = spec.max;
        }
        field.id = id; field.name = spec.name; field.autocomplete = 'off';
        field.dataset.dynLabel = spec.label;
        wrap.append(label);
        if (spec.type === 'select') {
          const sel = document.createElement('div'); sel.className = 'enq-select';
          sel.append(field);
          sel.insertAdjacentHTML('beforeend', '<svg class="enq-i"><use href="#i-chev"/></svg>');
          wrap.append(sel);
        } else wrap.append(field);
        roleFields.append(wrap);
      });
    }
    qa('input[name="category"]', mform).forEach(r => r.addEventListener('change', () => renderRole(r.value)));

    // ---- portfolio files: local preview only, never uploaded ----
    const drop = q('#bnm-drop');
    const fileInput = q('#bnm-files');
    const fileList = q('#bnm-file-list');
    const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime'];
    const fmtSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
    function fileFieldError(msg) {
      const field = drop.closest('.enq-field');
      if (msg) setErr(field, msg); else clearErr(field);
    }
    function addFiles(list) {
      let msg = '';
      for (const f of list) {
        if (files.length >= 5) { msg = 'Choose at most 5 files. No files have been uploaded.'; break; }
        if (!ACCEPT.includes(f.type)) { msg = `${f.name}: use JPG, PNG, WEBP, PDF, MP4 or MOV.`; continue; }
        if (f.size > 10 * 1024 * 1024) { msg = `${f.name} is larger than 10 MB.`; continue; }
        if (files.some(x => x.file.name === f.name && x.file.size === f.size)) continue;
        files.push({ file: f, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : '' });
      }
      fileFieldError(msg);
      renderFiles();
    }
    function renderFiles() {
      fileList.replaceChildren();
      files.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'bnm-file' + (item.url ? '' : ' bnm-file--doc');
        if (item.url) {
          const img = document.createElement('img'); img.src = item.url; img.alt = ''; el.append(img);
        } else {
          el.insertAdjacentHTML('beforeend', '<svg class="enq-i"><use href="#i-file"/></svg>');
        }
        const name = document.createElement('span'); name.className = 'bnm-file__name';
        const b = document.createElement('b'); b.textContent = item.file.name;
        const s = document.createElement('small'); s.textContent = fmtSize(item.file.size);
        name.append(b, s); el.append(name);
        const rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'bnm-file__rm';
        rm.setAttribute('aria-label', `Remove ${item.file.name}`);
        rm.innerHTML = '<svg class="enq-i"><use href="#i-x"/></svg>';
        rm.addEventListener('click', () => {
          if (item.url) URL.revokeObjectURL(item.url);
          files.splice(i, 1); fileFieldError(''); renderFiles();
        });
        el.append(rm);
        fileList.append(el);
      });
    }
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => { addFiles([...fileInput.files]); fileInput.value = ''; });
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-drag'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-drag'); }));
    drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));

    // ---- validation (same rules as the main form) ----
    function setErr(field, msg) {
      field.classList.add('is-invalid');
      let m = q(':scope > .enq-field__error', field);
      if (!m) { m = document.createElement('span'); m.className = 'enq-field__error'; field.append(m); }
      m.textContent = msg;
    }
    function clearErr(field) {
      field.classList.remove('is-invalid');
      q(':scope > .enq-field__error', field)?.remove();
    }
    function ageOn(birth, date) {
      const b = new Date(birth + 'T12:00:00'), d = new Date(date + 'T12:00:00');
      if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return -1;
      let y = d.getFullYear() - b.getFullYear();
      if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) y--;
      return y;
    }
    const radioVal = (name) => mform.querySelector(`input[name="${name}"]:checked`)?.value || '';

    function validateStep(n) {
      const container = steps[n - 1];
      const bad = [];
      const fail = (node, msg) => {
        const field = node.closest('.enq-field');
        if (bad.includes(field)) return;
        setErr(field, msg);
        bad.push(field);
      };
      qa('.enq-field', container).forEach(f => { if (!f.contains(drop)) clearErr(f); });

      qa('[data-group]', container).forEach(group => {
        if (group.dataset.group === 'files') return;
        if (!radioVal(group.dataset.group)) fail(group, 'Please choose one option.');
      });
      qa('input:not([type=radio]):not([type=file]), select, textarea', container).forEach(el => {
        if (el.closest('.enq-field')?.classList.contains('is-invalid')) return;
        if (el.type === 'checkbox') { if (el.required && !el.checked) fail(el, 'Please tick to confirm.'); return; }
        const v = el.value.trim();
        if (el.required && !v) { fail(el, 'This field is required.'); return; }
        if (v && !el.checkValidity()) fail(el, el.type === 'email' ? 'Please enter a valid email address.' : el.type === 'url' ? 'Please enter a full URL starting with https://' : 'Please enter a valid value.');
      });

      const el = mform.elements;
      if (n === 1) {
        const digits = el.phone.value.replace(/\D/g, '').length;
        if (el.phone.value.trim() && (digits < 10 || digits > 15)) fail(el.phone, 'Enter a valid mobile / WhatsApp number (10–15 digits).');
        if (el.dob.value && ageOn(el.dob.value, EVENT_LAST) < 21) fail(el.dob, 'Applicants must be at least 21 years old by 7 January 2027.');
      }
      if (n === 2 && drop.closest('.enq-field').classList.contains('is-invalid')) bad.push(drop.closest('.enq-field'));
      if (n === 3) {
        const d = radioVal('eventDate');
        if (d && ageOn(el.dob.value, d) < 21) fail(q('[data-group="eventDate"]', container), 'You must be 21 on your chosen audition date. Please choose a later date.');
      }

      if (bad.length) {
        errBox.textContent = bad.length === 1 ? 'Please check the highlighted field.' : `Please check the ${bad.length} highlighted fields.`;
        errBox.hidden = false;
        const target = q('input:not([type=hidden]),select,textarea,[tabindex="0"]', bad[0]);
        bad[0].scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
        target?.focus({ preventScroll: true });
        return false;
      }
      errBox.hidden = true;
      return true;
    }
    mform.addEventListener('input', (e) => {
      const f = e.target.closest('.enq-field');
      if (f?.classList.contains('is-invalid') && !f.contains(drop)) clearErr(f);
    });
    mform.addEventListener('change', (e) => {
      const f = e.target.closest('.enq-field');
      if (f?.classList.contains('is-invalid') && !f.contains(drop)) clearErr(f);
    });

    // ---- review ----
    function prettyDate(v) {
      if (!/^2027-01-0[1-7]$/.test(v)) return v || 'Not selected';
      return new Date(`${v}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const TIME = { morning: 'Morning (exact time TBD)', afternoon: 'Afternoon (exact time TBD)', evening: 'Evening (exact time TBD)' };
    const optText = (sel) => sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].text : '—';
    function row(dl, label, value, flag) {
      const d = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value || '—';
      if (flag) dd.className = 'is-flag';
      d.append(dt, dd); dl.append(d);
    }
    function renderReview() {
      const dl = q('#bnm-review'); dl.replaceChildren();
      const el = mform.elements;
      row(dl, 'Applicant', el.fullName.value.trim());
      row(dl, 'Category', CATEGORY_NAMES[radioVal('category')]);
      row(dl, 'Email', el.email.value.trim());
      row(dl, 'WhatsApp', el.phone.value.trim());
      row(dl, 'Date of birth', el.dob.value ? new Date(el.dob.value + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
      row(dl, 'Current location', [el.currentCity.value.trim(), el.state.value].filter(Boolean).join(', '));
      row(dl, 'Passport', optText(el.passport));
      row(dl, 'Experience', optText(el.experience));
      row(dl, 'Relocation to Dubai', optText(el.relocation));
      qa('[data-dyn-label]', roleFields).forEach(f => { if (f.value.trim()) row(dl, f.dataset.dynLabel, f.value.trim()); });
      if (el.portfolioUrl.value.trim()) row(dl, 'Portfolio URL', el.portfolioUrl.value.trim());
      row(dl, 'Portfolio files', files.length ? `${files.length} selected (not uploaded)` : 'None');
      row(dl, 'Preferred city', el.eventCity.value);
      row(dl, 'Preferred date', prettyDate(radioVal('eventDate')));
      row(dl, 'Time preference', TIME[radioVal('timePreference')] || 'TBD');
      if (el.accessibility.value.trim()) row(dl, 'Additional requirements', el.accessibility.value.trim());
      row(dl, 'Fee payable', '₹850 · via Razorpay', true);
    }

    // ---- step navigation ----
    const LABELS = { 1: 'Continue', 2: 'Continue', 3: 'Review details', 4: 'Pay ₹850 & register' };
    function paintStepper(active) {
      stepper.forEach(li => {
        const s = Number(li.dataset.s);
        li.classList.toggle('is-active', s === active);
        li.classList.toggle('is-done', s < active);
      });
    }
    function goTo(n) {
      step = Math.max(1, Math.min(4, n));
      steps.forEach(s => { s.hidden = Number(s.dataset.bnmStep) !== step; });
      head.hidden = step !== 1;
      backBtn.hidden = step === 1;
      nextLabel.textContent = LABELS[step];
      errBox.hidden = true;
      paintStepper(step);
      if (step === 4) renderReview();
      panel.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    }
    // ---- Razorpay payment ----
    // The browser never sees the secret key. The server (Netlify Functions) creates the
    // order + registration ID and verifies the payment signature before confirming.
    const PAY_API = (document.documentElement.dataset.payApi || '/.netlify/functions').replace(/\/$/, '');
    // <html data-pay-mode="demo"> → dummy Razorpay checkout, runs fully in the browser,
    // no keys/server needed and NO money is charged. Set data-pay-mode="live" for real Razorpay.
    const DEMO = document.documentElement.dataset.payMode !== 'live';
    if (DEMO) modal.classList.add('is-demo');
    const nextBtn = q('#bnm-next');
    let paying = false;

    function loadCheckout() {
      if (window.Razorpay) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = 'https://checkout.razorpay.com/v1/checkout.js';
        sc.onload = () => resolve();
        sc.onerror = () => reject(new Error('Could not load Razorpay. Check your internet connection and try again.'));
        document.head.append(sc);
      });
    }
    async function api(path, body) {
      let res;
      try {
        res = await fetch(`${PAY_API}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } catch {
        throw new Error('The payment service is unavailable right now. Please try again in a moment.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The payment service is unavailable right now. Please try again in a moment.');
      return data;
    }
    function setBusy(on, label) {
      paying = on;
      nextBtn.classList.toggle('is-busy', on);
      nextBtn.disabled = on;
      backBtn.disabled = on;
      nextLabel.textContent = on ? label : LABELS[step];
    }
    function payError(msg) {
      errBox.textContent = msg;
      errBox.hidden = false;
      errBox.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    }
    function applicationData() {
      const el = mform.elements;
      const data = {
        category: radioVal('category'), fullName: el.fullName.value.trim(), email: el.email.value.trim(),
        phone: el.phone.value.trim(), dob: el.dob.value, currentCity: el.currentCity.value.trim(), state: el.state.value,
        passport: el.passport.value, experience: el.experience.value, relocation: el.relocation.value,
        portfolioUrl: el.portfolioUrl.value.trim(), eventCity: el.eventCity.value,
        eventDate: radioVal('eventDate'), timePreference: radioVal('timePreference')
      };
      return data;
    }

    // ---- Dummy Razorpay (test mode) ----
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const CODES = { models: 'MOD', designers: 'DES', creators: 'PHV', beauty: 'BTY' };
    const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    function randCode(n) {
      const b = new Uint8Array(n); crypto.getRandomValues(b);
      return [...b].map(x => ALPHA[x % ALPHA.length]).join('');
    }
    async function demoCreateOrder(app) {
      await wait(700);
      return { keyId: 'rzp_test_dummy', orderId: `order_TEST${randCode(10)}`, amount: 85000, currency: 'INR',
        registrationId: `BNB27-${CODES[app.category] || 'GEN'}-${randCode(7)}` };
    }
    async function demoVerify(resp, order, app) {
      await wait(900);
      return { verified: true, test: true, registrationId: order.registrationId, paymentId: resp.razorpay_payment_id,
        orderId: order.orderId, amount: order.amount, status: 'captured', fullName: app.fullName,
        category: CATEGORY_NAMES[app.category], eventCity: app.eventCity, eventDate: app.eventDate, timePreference: app.timePreference };
    }
    // Same interface as window.Razorpay: new DemoCheckout(options).on('payment.failed', fn).open()
    class DemoCheckout {
      constructor(o) { this.o = o; this.failFns = []; }
      on(evt, fn) { if (evt === 'payment.failed') this.failFns.push(fn); }
      open() {
        const o = this.o;
        const amt = `₹${(o.amount / 100).toLocaleString('en-IN')}`;
        const el = document.createElement('div');
        el.className = 'dpay';
        el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Test payment');
        el.innerHTML = `
          <div class="dpay__box">
            <div class="dpay__top">
              <div><b>${'Belle N Beast'}</b><small></small></div>
              <button type="button" class="dpay__x" aria-label="Cancel payment">×</button>
            </div>
            <div class="dpay__test">Test mode · dummy payment · no money will be charged</div>
            <div class="dpay__amt"><span>Amount</span><strong>${amt}</strong></div>
            <div class="dpay__who"></div>
            <div class="dpay__body">
              <p class="dpay__label">Choose a payment method</p>
              <div class="dpay__methods">
                <label><input type="radio" name="dpay-m" value="UPI" checked><span>UPI</span><em>success@razorpay</em></label>
                <label><input type="radio" name="dpay-m" value="Card"><span>Card</span><em>4111 1111 1111 1111</em></label>
                <label><input type="radio" name="dpay-m" value="Netbanking"><span>Net banking</span><em>Test bank</em></label>
                <label><input type="radio" name="dpay-m" value="Wallet"><span>Wallet</span><em>Test wallet</em></label>
              </div>
              <p class="dpay__msg" role="alert" hidden></p>
              <button type="button" class="dpay__pay">Pay ${amt}</button>
              <button type="button" class="dpay__fail">Simulate a failed payment</button>
            </div>
            <div class="dpay__foot">Dummy checkout for testing · switch to live Razorpay before launch</div>
          </div>`;
        el.querySelector('.dpay__top small').textContent = o.description || '';
        el.querySelector('.dpay__who').textContent = [o.prefill?.name, o.prefill?.email, o.prefill?.contact].filter(Boolean).join(' · ');
        const msg = el.querySelector('.dpay__msg');
        const payBtn = el.querySelector('.dpay__pay');
        const failBtn = el.querySelector('.dpay__fail');
        const close = () => { el.classList.remove('is-open'); setTimeout(() => el.remove(), 350); };
        el.querySelector('.dpay__x').addEventListener('click', () => {
          if (el.classList.contains('is-busy')) return;
          close(); o.modal?.ondismiss?.();
        });
        payBtn.addEventListener('click', async () => {
          el.classList.add('is-busy'); msg.hidden = true;
          payBtn.textContent = 'Processing payment…';
          await wait(1400);
          payBtn.textContent = '✓ Payment successful';
          await wait(600);
          close();
          o.handler({ razorpay_order_id: o.order_id, razorpay_payment_id: `pay_TEST${randCode(10)}`, razorpay_signature: 'test_mode_signature' });
        });
        failBtn.addEventListener('click', async () => {
          el.classList.add('is-busy'); msg.hidden = true;
          payBtn.textContent = 'Processing payment…';
          await wait(1100);
          el.classList.remove('is-busy');
          payBtn.textContent = `Retry · Pay ${amt}`;
          msg.textContent = 'Payment failed (simulated): your bank declined the transaction. Try again or pick another method.';
          msg.hidden = false;
          this.failFns.forEach(fn => fn({ error: { description: 'Simulated failure in test mode.' } }));
        });
        document.body.append(el);
        void el.offsetWidth; el.classList.add('is-open');
        payBtn.focus();
      }
    }

    async function startPayment() {
      const app = applicationData();
      setBusy(true, 'Preparing secure payment…');
      let order;
      try {
        order = DEMO ? await demoCreateOrder(app) : (await Promise.all([api('create-order', app), loadCheckout()]))[0];
      } catch (err) {
        setBusy(false); payError(err.message); return;
      }
      setBusy(true, 'Waiting for payment…');
      const Checkout = DEMO ? DemoCheckout : window.Razorpay;
      const rzp = new Checkout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Belle N Beast',
        description: `India Talent Hunt 2027 · ${order.registrationId}`,
        prefill: { name: app.fullName, email: app.email, contact: app.phone.replace(/[^\d+]/g, '') },
        notes: { registration_id: order.registrationId },
        theme: { color: '#9b7a45' },
        modal: {
          ondismiss: () => { if (paying) { setBusy(false); payError('Payment was cancelled. Your registration is not complete — you can try again whenever you are ready.'); } },
          confirm_close: true
        },
        handler: async (resp) => {
          setBusy(true, 'Confirming payment…');
          try {
            const result = DEMO ? await demoVerify(resp, order, app) : await api('verify-payment', resp);
            if (!result.verified) throw new Error(result.error || 'Payment could not be verified.');
            showConfirmation(result, app);
          } catch (err) {
            setBusy(false);
            payError(`${err.message} If money was deducted, contact us with payment ID ${resp.razorpay_payment_id} — do not pay again.`);
          }
        }
      });
      rzp.on('payment.failed', (r) => {
        // Razorpay keeps its window open so the applicant can retry; just record the reason.
        errBox.textContent = `Payment failed: ${r?.error?.description || 'please try another method.'}`;
        errBox.hidden = false;
      });
      rzp.open();
    }

    const STORE_KEY = 'bnb-ith27-registration';
    function showConfirmation(r, app) {
      paying = false;
      nextBtn.classList.remove('is-busy');
      nextBtn.disabled = false; backBtn.disabled = false;
      q('#bnm-regid').textContent = r.registrationId;
      const sum = q('#bnm-summary'); sum.replaceChildren();
      row(sum, 'Registration ID', r.registrationId);
      row(sum, 'Payment ID', r.paymentId);
      row(sum, 'Applicant', r.fullName || app?.fullName);
      row(sum, 'Profession', r.category || CATEGORY_NAMES[app?.category]);
      row(sum, 'City', r.eventCity || app?.eventCity);
      row(sum, 'Date', prettyDate(r.eventDate || app?.eventDate));
      row(sum, 'Time preference', TIME[r.timePreference || app?.timePreference] || 'TBD');
      row(sum, 'Amount paid', `₹${((r.amount || 85000) / 100).toLocaleString('en-IN')}`);
      const st = document.createElement('div');
      st.innerHTML = r.test
        ? '<dt>Status</dt><dd class="is-flag">Test payment · no money charged</dd>'
        : '<dt>Status</dt><dd class="is-ok">Paid · Registered</dd>';
      q('#bnm-done .bnm-eyebrow').textContent = r.test ? 'Test payment successful · Registration submitted' : 'Payment successful · Registration confirmed';
      sum.append(st);
      mform.hidden = true;
      head.hidden = true;
      errBox.hidden = true;
      done.hidden = false;
      paintStepper(5);
      panel.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...r, savedAt: Date.now() })); } catch {}
    }
    // Reopening the popup after paying (even after a reload) shows the confirmation again.
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved?.registrationId) showConfirmation(saved, null);
    } catch {}

    q('#bnm-copy').addEventListener('click', async () => {
      const id = q('#bnm-regid').textContent;
      const label = q('#bnm-copy .enq-btn__in > span');
      try { await navigator.clipboard.writeText(id); label.textContent = 'Copied ✓'; }
      catch { label.textContent = 'Select & copy the ID above'; }
      setTimeout(() => { label.textContent = 'Copy ID'; }, 2200);
    });
    // Start a fresh registration (e.g. another applicant on the same device).
    q('#bnm-new').addEventListener('click', () => {
      try { localStorage.removeItem(STORE_KEY); } catch {}
      mform.reset();
      files.forEach(f => f.url && URL.revokeObjectURL(f.url));
      files = []; renderFiles();
      renderRole('');
      qa('.enq-field', mform).forEach(clearErr);
      done.hidden = true;
      mform.hidden = false;
      goTo(1);
      q('#bnm-name').focus({ preventScroll: true });
    });
    q('#bnm-print').addEventListener('click', () => {
      document.body.classList.add('bnm-printing');
      window.print();
      setTimeout(() => document.body.classList.remove('bnm-printing'), 500);
    });

    mform.addEventListener('submit', (e) => {
      e.preventDefault();
      if (paying) return;
      if (!validateStep(step)) return;
      if (step < 4) { goTo(step + 1); return; }
      startPayment();
    });
    backBtn.addEventListener('click', () => { if (!paying) goTo(step - 1); });
  })();
})();
