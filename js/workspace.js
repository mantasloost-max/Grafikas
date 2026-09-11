// Shared workspace navigation and editing feedback.
let workspaceReady = false;
let workspaceView = 'week';
let workspaceYearCalendarHidden = true;
let workspaceMonday = null;
let undoState = null;
let workspaceRefreshPending = false;
let moduleDrawer = null;

function showNotice(message, canUndo = false) {
    let toast = document.getElementById('workspaceToast');
    if (!toast) {
        toast = document.createElement('div'); toast.id = 'workspaceToast';
        toast.setAttribute('role', 'status'); document.body.appendChild(toast);
    }
    toast.replaceChildren(document.createTextNode(message));
    if (canUndo && undoState) {
        const button = document.createElement('button'); button.textContent = 'Atšaukti pakeitimą';
        button.onclick = () => {
            state = JSON.parse(undoState); localStorage.setItem(storageKey, undoState); undoState = null;
            renderFilters(); renderAll(); renderVacationsList(); showNotice('Pakeitimas atšauktas.');
            if (window.updateGitHubStatus) window.updateGitHubStatus();
        };
        toast.appendChild(button);
    }
    const close = document.createElement('button'); close.textContent = '×'; close.setAttribute('aria-label', 'Uždaryti pranešimą');
    close.onclick = () => toast.hidden = true; toast.appendChild(close); toast.hidden = false;
}

function fieldError(field, message) {
    if (!field) { showNotice(message); return; }
    field.setAttribute('aria-invalid', 'true');
    let error = field.parentElement.querySelector('.field-error');
    if (!error) { error = document.createElement('span'); error.className = 'field-error'; error.setAttribute('role', 'alert'); field.after(error); }
    error.textContent = message;
    field.focus();
    field.addEventListener('input', () => { error.remove(); field.removeAttribute('aria-invalid'); }, {once:true});
}

function mountWorkspaceView(overlay, view) {
    if (!workspaceReady) { document.body.appendChild(overlay); return; }
    workspaceView = view;
    const pane = document.getElementById('workspacePane');
    pane.hidden = false; pane.replaceChildren(overlay);
    document.getElementById('workspaceModules').hidden = true;
    document.getElementById('workspaceVacations').hidden = true;
    overlay.className = 'workspace-view';
    overlay.querySelector('.dialog')?.classList.add('workspace-dialog');
    if (view === 'week' && !modulesFiltered().length) {
        const banner = document.createElement('div'); banner.className = 'workspace-onboarding';
        banner.textContent = state.modules.length ? 'Pagal pasirinktus filtrus modulių nėra. Išvalykite filtrus.' : 'Pradėkite nuo „+ Modulis“ arba importuokite turimą planą. Duomenys saugomi šioje naršyklėje.';
        overlay.querySelector('.dialog').firstElementChild.after(banner);
    }
    const close = overlay.querySelector('.close'); if (close) close.hidden = true;
    syncWorkspaceNav();
}

function syncWorkspaceNav() {
    document.querySelectorAll('[data-view]').forEach(button => {
        const selected = button.dataset.view === workspaceView;
        button.setAttribute('aria-current', selected ? 'page' : 'false');
    });
}

function navigateWorkspace(view) {
    workspaceView = view;
    document.getElementById('workspacePane').replaceChildren();
    document.getElementById('workspacePane').hidden = true;
    document.getElementById('workspaceModules').hidden = view !== 'modules';
    document.getElementById('workspaceVacations').hidden = view !== 'vacations';
    if (view === 'week') openWeeklyDialog();
    if (view === 'year') openYearlyGridDialog();
    if (view === 'modules') {
        renderSidebar();
        const empty = document.getElementById('modulesEmpty'); empty.hidden = modulesFiltered().length > 0;
    }
    if (view === 'vacations') { renderGroupCheckboxes(); renderVacationsList(); renderVacationGantt(); }
    syncWorkspaceNav();
}

function refreshWorkspace() {
    if (!workspaceReady || workspaceRefreshPending) return;
    workspaceRefreshPending = true;
    queueMicrotask(() => { workspaceRefreshPending = false; navigateWorkspace(workspaceView); });
}

function openModuleDrawer() {
    if (!moduleDrawer) return;
    moduleDrawer.hidden = false;
    document.getElementById('mName').focus();
}
function closeModuleDrawer() { if (moduleDrawer) moduleDrawer.hidden = true; }

function openLessonDetails(event, date) {
    const overlay = document.createElement('div'); overlay.className = 'annual-edit-overlay';
    const section = document.createElement('section'); section.className = 'annual-edit-dialog';
    section.setAttribute('role','dialog'); section.setAttribute('aria-modal','true'); section.setAttribute('aria-label','Pamokos informacija');
    const heading = document.createElement('h3'); heading.textContent = event.mod.name; section.appendChild(heading);
    for (const text of [`${event.mod.group} · ${toLocalISO(date)}`, formatRange(event.start, event.len), event.mod.teacher || 'Mokytojas nenurodytas']) {
        const p = document.createElement('p'); p.textContent = text; section.appendChild(p);
    }
    const footer = document.createElement('footer');
    const edit = document.createElement('button'); edit.className = 'save'; edit.textContent = 'Keisti šią savaitę';
    edit.onclick = () => { overlay.remove(); openAnnualWeekEditor(event.mod, toLocalISO(getMonday(date)), refreshWorkspace); };
    const close = document.createElement('button'); close.textContent = 'Uždaryti'; close.onclick = () => overlay.remove();
    footer.append(close, edit); section.appendChild(footer); overlay.appendChild(section); document.body.appendChild(overlay); close.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('workspace-app');
    const legacy = document.querySelector('main'); legacy.id = 'legacyLayout';
    const filters = document.getElementById('mainContent').firstElementChild;
    filters.id = 'workspaceFilters';
    const nav = document.createElement('nav'); nav.id = 'workspaceNav'; nav.setAttribute('aria-label', 'Pagrindinė navigacija');
    nav.innerHTML = '<div class="workspace-tabs"><button data-view="week">Savaitė</button><button data-view="year">Metai</button><button data-view="modules">Moduliai</button><button data-view="vacations">Atostogos</button></div><span id="saveStatus">Išsaugoma šioje naršyklėje</span><button id="newModuleButton" class="primary-button">+ Modulis</button>';
    const root = document.createElement('div'); root.id = 'workspaceRoot';
    const pane = document.createElement('div'); pane.id = 'workspacePane';
    const modules = document.createElement('section'); modules.id = 'workspaceModules'; modules.hidden = true;
    modules.innerHTML = '<h2>Moduliai</h2><p class="workspace-subtitle">Tikslinės valandos, likutis ir planuojama pabaiga.</p><div id="modulesEmpty" class="workspace-empty">Nėra rodomų modulių. Pridėkite modulį arba išvalykite filtrus.</div>';
    modules.appendChild(document.getElementById('miniList'));
    const vacations = document.createElement('section'); vacations.id = 'workspaceVacations'; vacations.hidden = true;
    vacations.appendChild(document.getElementById('vType').closest('.bg-white.p-5.rounded-xl.border.border-slate-200.shadow-card'));
    root.append(nav, filters, pane, modules, vacations); legacy.before(root);
    const clear = document.createElement('button'); clear.id = 'clearFilters'; clear.textContent = 'Išvalyti filtrus';
    clear.onclick = () => { ['groupFilter','moduleFilter','teacherFilter'].forEach(id => document.getElementById(id).value = ''); renderAll(); };
    filters.appendChild(clear);
    const settings = document.createElement('details'); settings.className = 'workspace-settings';
    settings.innerHTML = '<summary>Mokslo metų datos</summary>';
    settings.appendChild(document.getElementById('sem2Start').parentElement.parentElement);
    filters.insertBefore(settings, clear);
    moduleDrawer = document.createElement('div'); moduleDrawer.id = 'moduleDrawer'; moduleDrawer.className = 'annual-edit-overlay'; moduleDrawer.hidden = true;
    const form = document.getElementById('mName').closest('.bg-white.rounded-2xl');
    form.classList.add('module-drawer-form'); form.setAttribute('role', 'dialog'); form.setAttribute('aria-modal', 'true'); form.setAttribute('aria-label', 'Naujas modulis');
    const cancel = document.createElement('button'); cancel.className = 'drawer-close'; cancel.textContent = 'Uždaryti'; cancel.onclick = closeModuleDrawer; form.prepend(cancel);
    moduleDrawer.appendChild(form); document.body.appendChild(moduleDrawer);
    nav.querySelectorAll('[data-view]').forEach(button => button.onclick = () => navigateWorkspace(button.dataset.view));
    document.getElementById('newModuleButton').onclick = openModuleDrawer;
    ['btnWeekly','btnYearly'].forEach(id => document.getElementById(id).hidden = true);
    document.getElementById('btnAutoImage').hidden = true;
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const top = [...document.querySelectorAll('.annual-edit-overlay:not([hidden]), .overlay')].pop();
            if (top === moduleDrawer) closeModuleDrawer(); else if (top) top.remove();
        }
        if (e.key === 'Tab') {
            const top = [...document.querySelectorAll('.annual-edit-overlay:not([hidden]), .overlay')].pop();
            if (!top) return;
            const controls = [...top.querySelectorAll('button, input, select, [tabindex="0"]')].filter(x => !x.disabled && x.getClientRects().length);
            const first = controls[0], last = controls[controls.length - 1];
            if (first && e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (last && !e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });
    workspaceReady = true; navigateWorkspace('week');
});

function askConfirmation(title, description) {
    return new Promise(resolve => {
        const overlay = document.createElement('div'); overlay.className = 'annual-edit-overlay';
        const dialog = document.createElement('section'); dialog.className = 'annual-edit-dialog'; dialog.setAttribute('role', 'alertdialog'); dialog.setAttribute('aria-modal','true');
        const h = document.createElement('h3'); h.textContent = title;
        const p = document.createElement('p'); p.textContent = description;
        const footer = document.createElement('footer');
        const cancel = document.createElement('button'); cancel.textContent = 'Atšaukti';
        const proceed = document.createElement('button'); proceed.className = 'save'; proceed.textContent = 'Patvirtinti';
        const finish = value => { overlay.remove(); resolve(value); };
        cancel.onclick = () => finish(false); proceed.onclick = () => finish(true);
        overlay.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); finish(false); } });
        footer.append(cancel, proceed); dialog.append(h,p,footer); overlay.appendChild(dialog); document.body.appendChild(overlay); cancel.focus();
    });
}
