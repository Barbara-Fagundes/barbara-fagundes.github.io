/* Presentation uses curated summaries only. Never load research journals here. */
(async function () {
  const categories = [
    ['Instructional materials', 'Instructional materials developed or improved'],
    ['Curriculum and assessment', 'Curriculum or assessment changes implemented'],
    ['Adoption', 'Documented adoption of teaching practices'],
    ['Observations and professional feedback', 'Classroom observations and professional feedback'],
    ['Student feedback', 'Student feedback or evaluation summaries'],
    ['Professional development', 'Professional development activities'],
    ['Presentations, publications and recognition', 'Presentations, publications, and academic recognition']
  ];
  const statuses = ['In Progress', 'Documented', 'Ready for Publication'];
  const levels = ['Implementation', 'Adoption', 'Learning improvement'];
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const pending = value => value || 'Not yet documented.';
  function localAsset(value, directory) {
    return typeof value === 'string' && new RegExp('^' + directory + '/[a-zA-Z0-9_ /-]+\\.[a-zA-Z0-9]+$').test(value) && !value.includes('..');
  }
  function evidenceItem(item) {
    const box = el('article', undefined, 'evidence-record');
    box.append(el('h4', item.title), el('p', item.level + ' · ' + pending(item.period), 'status'));
    for (const [label, key] of [['Description', 'description'], ['Source', 'source'], ['Limitations', 'limitations'], ['Permission / review', 'permissionNote']]) {
      const p = el('p'); p.append(el('strong', label + ': '), document.createTextNode(pending(item[key]))); box.append(p);
    }
    if (item.href) {
      const link = el('a', 'View supporting material →'); link.href = item.href; box.append(link);
    }
    return box;
  }
  function addField(parent, label, value) {
    const p = el('p'); p.append(el('span', label + ': ', 'field-label'), document.createTextNode(pending(value))); parent.append(p);
  }
  function step(parent, title, fields) {
    const part = el('div', undefined, 'case-step'); part.append(el('h4', title));
    fields.forEach(([label, value]) => addField(part, label, value)); parent.append(part); return part;
  }
  function openCase(id, focus = false) {
    const detail = document.getElementById(id);
    if (detail && detail.tagName === 'DETAILS') {
      detail.open = true;
      if (focus) detail.querySelector('summary').focus({preventScroll: true});
      detail.scrollIntoView({block: 'start'});
    }
  }
  try {
    const response = await fetch('teaching-cases.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Could not load the teaching case collection.');
    const data = await response.json();
    if (!Array.isArray(data.cases) || !Array.isArray(data.evidence)) throw new Error('Cases and evidence must be arrays.');
    const evidenceById = new Map();
    for (const item of data.evidence) {
      if (!item.id || evidenceById.has(item.id) || !item.title || !levels.includes(item.level) || !categories.some(([key]) => key === item.category)) throw new Error('Check evidence IDs, titles, categories, and levels.');
      if (item.href && !localAsset(item.href, 'evidence')) throw new Error('Evidence links must be local files under evidence/.');
      evidenceById.set(item.id, item);
    }
    const ids = new Set();
    for (const item of data.cases) {
      if (!/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id) || !item.title || !statuses.includes(item.status) || typeof item.draft !== 'boolean' || !Array.isArray(item.supportingEvidence)) throw new Error('Check case IDs, titles, statuses, draft flags, and evidence lists.');
      if (item.supportingEvidence.some(id => !evidenceById.has(id))) throw new Error('A case references an unknown evidence ID.');
      ids.add(item.id);
    }
    // Validate before rendering, so an invalid entry cannot silently disappear.
    for (const item of data.cases) {
      const card = el('article', undefined, 'project-card');
      card.append(el('p', item.category, 'card-category'), el('h3', item.title), el('p', item.summary || 'Summary pending.', 'card-desc'));
      card.append(el('p', item.course + ' · ' + (item.period || 'Period pending'), 'card-meta'), el('span', (item.draft ? 'Draft · ' : '') + item.status, 'status'));
      const link = el('a', 'Explore the decision →', 'case-link'); link.href = '#case-' + item.id;
      link.addEventListener('click', event => {
        event.preventDefault();
        history.pushState(null, '', '#case-' + item.id);
        openCase('case-' + item.id, true);
      }); card.append(link);
      document.getElementById('case-cards').append(card);
      const detail = el('details', undefined, 'decision-case'); detail.id = 'case-' + item.id;
      const summary = el('summary'); summary.append(el('h3', item.title), el('span', (item.draft ? 'Draft · ' : '') + item.status + ' · ' + (item.period || 'Period pending'), 'summary-meta')); detail.append(summary);
      const content = el('div', undefined, 'case-content'); const facts = el('dl', undefined, 'case-facts');
      for (const [label, key] of [['Date / period', 'period'], ['Institution', 'institution'], ['Course', 'course'], ['My role', 'role'], ['Category', 'category'], ['Status', 'status']]) {
        const pair = el('div'); pair.append(el('dt', label), el('dd', pending(item[key]))); facts.append(pair);
      }
      content.append(facts);
      step(content, '1. Context and Challenge', [['Context', item.context], ['Problem or challenge', item.challenge]]);
      step(content, '2. Decision-Making Process', [['Decision', item.decision]]);
      step(content, '3. Alternatives Considered', [['Alternatives and tradeoffs', item.alternatives]]);
      step(content, '4. Pedagogical Rationale', [['Rationale', item.rationale]]);
      step(content, '5. Implementation and Collaboration', [['Implementation', item.implementation], ['Collaboration and support', item.collaboration]]);
      const evidenceStep = step(content, '6. Available Evidence', []);
      if (item.supportingEvidence.length) item.supportingEvidence.forEach(id => evidenceStep.append(evidenceItem(evidenceById.get(id))));
      else evidenceStep.append(el('p', 'No supporting evidence added. Implementation, adoption, and learning improvement have not been established in this draft.', 'pending'));
      step(content, '7. Observed Outcomes and Limitations', [['Observed outcomes', item.observedOutcomes], ['Limitations', item.limitations]]);
      step(content, '8. Reflection and Lessons Learned', [['Reflection', item.reflection]]);
      detail.append(content); document.getElementById('decision-cases').append(detail);
    }
    for (const [key, title] of categories) {
      const group = el('div', undefined, 'evidence-group'); group.append(el('h3', title));
      const items = data.evidence.filter(item => item.category === key);
      if (items.length) items.forEach(item => group.append(evidenceItem(item)));
      else group.append(el('p', 'No evidence added. A reviewed, non-confidential summary or artifact can be linked here.', 'pending'));
      document.getElementById('evidence-collection').append(group);
    }
    if (data.portrait?.src) {
      if (!(localAsset(data.portrait.src, 'assets') || localAsset(data.portrait.src, 'files')) || !data.portrait.alt) throw new Error('Portrait requires a local assets/ or files/ path and descriptive alt text.');
      const image = document.createElement('img'); image.alt = data.portrait.alt;
      image.addEventListener('load', () => {
        document.getElementById('image-placeholder').replaceWith(image);
        document.getElementById('portrait-caption').textContent = data.portrait.caption || 'Bárbara Fagundes · Teaching and reflective practice';
      });
      image.addEventListener('error', () => { document.getElementById('portrait-caption').textContent = 'Portrait unavailable. Check the local image path.'; });
      image.src = data.portrait.src;
    }
    window.addEventListener('hashchange', () => openCase(location.hash.slice(1)));
    if (location.hash) openCase(location.hash.slice(1));
  } catch (error) {
    const notice = document.getElementById('load-error'); notice.hidden = false;
    notice.textContent = 'The case collection is temporarily unavailable. Please try reloading this page.';
  }
})();
