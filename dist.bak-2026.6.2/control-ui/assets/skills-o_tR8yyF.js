import{m as e,o as t,p as n,r}from"./lit-runtime-BImxIzGR.js";import{o as i,t as a}from"./string-coerce-DV_ny4Fi.js";import{P as o,R as s,_ as c,g as l}from"./index-DThJhH6P.js";import{i as u,n as d,r as f,t as p}from"./skills-shared-CNlkuf6o.js";function m(e){return e?l(e,window.location.href):null}function h(e){!(e instanceof HTMLDialogElement)||e.open||(e.isConnected?e.showModal():queueMicrotask(()=>{e.isConnected&&!e.open&&e.showModal()}))}var g=[{id:`all`,label:`All`},{id:`ready`,label:`Ready`},{id:`needs-setup`,label:`Needs Setup`},{id:`disabled`,label:`Disabled`}];function _(e,t){switch(t){case`all`:return!0;case`ready`:return!e.disabled&&e.eligible;case`needs-setup`:return!e.disabled&&!e.eligible;case`disabled`:return e.disabled}throw Error(`Unsupported skills status filter`)}function v(e){return e.disabled?`muted`:e.eligible?`ok`:`warn`}function y(e,t){let n=e.clawhub;return!n||n.status!==`linked`||!n.valid?null:t[o({registry:n.registry,slug:n.slug,version:n.installedVersion})]??null}function b(e){if(!e)return`Unavailable`;let t=e.securityStatus?.trim()||null;return e.ok&&e.decision===`pass`?t===`clean`||!t?`Clean`:t:t===`pending`||t===`not-run`?`Pending`:t===`malicious`?`Blocked`:t===`suspicious`?`Review`:`Unavailable`}function x(e){if(!e)return`chip-warn`;if(e.ok&&e.decision===`pass`)return`chip-ok`;let t=e.securityStatus?.trim()||null;return t===`pending`||t===`not-run`?`chip`:`chip-warn`}function S(t){let r=t.report?.skills??[],o={all:r.length,ready:0,"needs-setup":0,disabled:0};for(let e of r)e.disabled?o.disabled++:e.eligible?o.ready++:o[`needs-setup`]++;let s=t.statusFilter===`all`?r:r.filter(e=>_(e,t.statusFilter)),c=a(t.filter),l=c?s.filter(e=>a([e.name,e.description,e.source].join(` `)).includes(c)):s,d=u(l),f=t.detailKey?r.find(e=>e.skillKey===t.detailKey)??null:null;return e`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Skills</div>
          <div class="card-sub">Installed skills and their status.</div>
        </div>
        <button
          class="btn"
          ?disabled=${t.loading||!t.connected}
          @click=${t.onRefresh}
        >
          ${t.loading?i(`common.loading`):i(`common.refresh`)}
        </button>
      </div>

      <div class="agent-tabs" style="margin-top: 14px;">
        ${g.map(n=>e`
            <button
              class="agent-tab ${t.statusFilter===n.id?`active`:``}"
              @click=${()=>t.onStatusFilterChange(n.id)}
            >
              ${n.label}<span class="agent-tab-count">${o[n.id]}</span>
            </button>
          `)}
      </div>

      <div
        class="filters"
        style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px;"
      >
        <label class="field" style="flex: 1; min-width: 180px;">
          <input
            .value=${t.filter}
            @input=${e=>t.onFilterChange(e.target.value)}
            placeholder="Filter installed skills"
            autocomplete="off"
            name="skills-filter"
          />
        </label>
        <div class="muted">${l.length} shown</div>
      </div>

      <div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="font-weight: 600;">ClawHub</div>
          <div class="muted" style="font-size: 13px;">
            Search and install skills from the registry
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <label class="field" style="flex: 1; min-width: 180px;">
            <input
              .value=${t.clawhubQuery}
              @input=${e=>t.onClawHubQueryChange(e.target.value)}
              placeholder="Search ClawHub skills…"
              autocomplete="off"
              name="clawhub-search"
            />
          </label>
          ${t.clawhubSearchLoading?e`<span class="muted">Searching…</span>`:n}
        </div>
        ${t.clawhubSearchError?e`<div class="callout danger" style="margin-top: 8px;">
              ${t.clawhubSearchError}
            </div>`:n}
        ${t.clawhubInstallMessage?e`<div
              class="callout ${t.clawhubInstallMessage.kind===`error`?`danger`:`success`}"
              style="margin-top: 8px;"
            >
              ${t.clawhubInstallMessage.text}
            </div>`:n}
        ${C(t)}
      </div>

      ${t.error?e`<div class="callout danger" style="margin-top: 12px;">${t.error}</div>`:n}
      ${l.length===0?e`
            <div class="muted" style="margin-top: 16px">
              ${!t.connected&&!t.report?`Not connected to gateway.`:`No skills found.`}
            </div>
          `:e`
            <div class="agent-skills-groups" style="margin-top: 16px;">
              ${d.map(n=>e`
                  <details class="agent-skills-group" open>
                    <summary class="agent-skills-header">
                      <span>${n.label}</span>
                      <span class="muted">${n.skills.length}</span>
                    </summary>
                    <div class="list skills-grid">
                      ${n.skills.map(e=>T(e,t))}
                    </div>
                  </details>
                `)}
            </div>
          `}
    </section>

    ${f?E(f,t):n}
    ${t.clawhubDetailSlug?w(t):n}
  `}function C(t){let r=t.clawhubResults;return r?r.length===0?e`<div class="muted" style="margin-top: 8px;">No skills found on ClawHub.</div>`:e`
    <div class="list" style="margin-top: 8px;">
      ${r.map(r=>e`
          <div
            class="list-item list-item-clickable"
            @click=${()=>t.onClawHubDetailOpen(r.slug)}
          >
            <div class="list-main">
              <div class="list-title">${r.displayName}</div>
              <div class="list-sub">${r.summary?s(r.summary,120):r.slug}</div>
            </div>
            <div class="list-meta" style="display: flex; align-items: center; gap: 8px;">
              ${r.version?e`<span class="muted" style="font-size: 12px;">v${r.version}</span>`:n}
              <button
                class="btn btn--sm"
                ?disabled=${t.clawhubInstallSlug!==null}
                @click=${e=>{e.stopPropagation(),t.onClawHubInstall(r.slug)}}
              >
                ${t.clawhubInstallSlug===r.slug?`Installing…`:`Install`}
              </button>
            </div>
          </div>
        `)}
    </div>
  `:n}function w(r){let a=r.clawhubDetail;return e`
    <dialog
      class="md-preview-dialog"
      ${t(h)}
      @click=${e=>{let t=e.currentTarget;e.target===t&&t.close()}}
      @close=${r.onClawHubDetailClose}
    >
      <div class="md-preview-dialog__panel">
        <div class="md-preview-dialog__header">
          <div class="md-preview-dialog__title">
            ${a?.skill?.displayName??r.clawhubDetailSlug}
          </div>
          <button
            class="btn btn--sm"
            @click=${e=>{e.currentTarget.closest(`dialog`)?.close()}}
          >
            Close
          </button>
        </div>
        <div class="md-preview-dialog__body" style="display: grid; gap: 16px;">
          ${r.clawhubDetailLoading?e`<div class="muted">${i(`common.loading`)}</div>`:r.clawhubDetailError?e`<div class="callout danger">${r.clawhubDetailError}</div>`:a?.skill?e`
                    <div style="font-size: 14px; line-height: 1.5;">
                      ${a.skill.summary??``}
                    </div>
                    ${a.owner?.displayName?e`<div class="muted" style="font-size: 13px;">
                          By
                          ${a.owner.displayName}${a.owner.handle?e` (@${a.owner.handle})`:n}
                        </div>`:n}
                    ${a.latestVersion?e`<div class="muted" style="font-size: 13px;">
                          Latest: v${a.latestVersion.version}
                        </div>`:n}
                    ${a.latestVersion?.changelog?e`<div
                          style="font-size: 13px; border-top: 1px solid var(--border); padding-top: 12px; white-space: pre-wrap;"
                        >
                          ${a.latestVersion.changelog}
                        </div>`:n}
                    ${a.metadata?.os?e`<div class="muted" style="font-size: 12px;">
                          Platforms: ${a.metadata.os.join(`, `)}
                        </div>`:n}
                    <button
                      class="btn primary"
                      ?disabled=${r.clawhubInstallSlug!==null}
                      @click=${()=>{r.clawhubDetailSlug&&r.onClawHubInstall(r.clawhubDetailSlug)}}
                    >
                      ${r.clawhubInstallSlug===r.clawhubDetailSlug?`Installing…`:`Install ${a.skill.displayName}`}
                    </button>
                  `:e`<div class="muted">Skill not found.</div>`}
        </div>
      </div>
    </dialog>
  `}function T(t,r){let i=r.busyKey===t.skillKey,a=v(t),o=y(t,r.clawhubVerdicts);return e`
    <div class="list-item list-item-clickable" @click=${()=>r.onDetailOpen(t.skillKey)}>
      <div class="list-main">
        <div class="list-title" style="display: flex; align-items: center; gap: 8px;">
          <span class="statusDot ${a}"></span>
          ${t.emoji?e`<span>${t.emoji}</span>`:n}
          <span>${t.name}</span>
        </div>
        <div class="list-sub">${s(t.description,140)}</div>
      </div>
      <div
        class="list-meta"
        style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;"
      >
        ${t.clawhub?.status===`linked`?e`<span class="chip ${x(o)}">${b(o)}</span>`:t.clawhub?.status===`invalid`?e`<span class="chip chip-warn">ClawHub link invalid</span>`:n}
        <label class="skill-toggle-wrap" @click=${e=>e.stopPropagation()}>
          <input
            type="checkbox"
            class="skill-toggle"
            .checked=${!t.disabled}
            ?disabled=${i}
            @change=${e=>{e.stopPropagation(),r.onToggle(t.skillKey,t.disabled)}}
          />
        </label>
      </div>
    </div>
  `}function E(r,i){let a=i.busyKey===r.skillKey,o=i.edits[r.skillKey]??``,s=i.messages[r.skillKey]??null,c=r.install.length>0&&r.missing.bins.length>0,l=!!(r.bundled&&r.source!==`openclaw-bundled`),u=p(r),g=d(r),_=y(r,i.clawhubVerdicts),b=i.detailTab===`card`&&r.skillCard?.present?`card`:`overview`;return e`
    <dialog
      class="md-preview-dialog"
      ${t(h)}
      @click=${e=>{let t=e.currentTarget;e.target===t&&t.close()}}
      @close=${i.onDetailClose}
    >
      <div class="md-preview-dialog__panel">
        <div class="md-preview-dialog__header">
          <div
            class="md-preview-dialog__title"
            style="display: flex; align-items: center; gap: 8px;"
          >
            <span class="statusDot ${v(r)}"></span>
            ${r.emoji?e`<span style="font-size: 18px;">${r.emoji}</span>`:n}
            <span>${r.name}</span>
          </div>
          <button
            class="btn btn--sm"
            @click=${e=>{e.currentTarget.closest(`dialog`)?.close()}}
          >
            Close
          </button>
        </div>
        <div class="md-preview-dialog__body" style="display: grid; gap: 16px;">
          <div>
            <div style="font-size: 14px; line-height: 1.5; color: var(--text);">
              ${r.description}
            </div>
            ${f({skill:r,showBundledBadge:l})}
          </div>

          ${r.clawhub||r.skillCard?.present?e`
                <div class="agent-tabs">
                  <button
                    class="agent-tab ${b===`overview`?`active`:``}"
                    @click=${()=>i.onDetailTabChange(`overview`)}
                  >
                    Overview
                  </button>
                  ${r.skillCard?.present?e`<button
                        class="agent-tab ${b===`card`?`active`:``}"
                        @click=${()=>i.onDetailTabChange(`card`)}
                      >
                        Skill Card
                      </button>`:n}
                </div>
              `:n}
          ${b===`overview`?D(r,i,_):O(r,i)}
          ${u.length>0?e`
                <div
                  class="callout"
                  style="border-color: var(--warn-subtle); background: var(--warn-subtle); color: var(--warn);"
                >
                  <div style="font-weight: 600; margin-bottom: 4px;">Missing requirements</div>
                  <div>${u.join(`, `)}</div>
                </div>
              `:n}
          ${g.length>0?e`
                <div class="muted" style="font-size: 13px;">Reason: ${g.join(`, `)}</div>
              `:n}

          <div style="display: flex; align-items: center; gap: 12px;">
            <label class="skill-toggle-wrap">
              <input
                type="checkbox"
                class="skill-toggle"
                .checked=${!r.disabled}
                ?disabled=${a}
                @change=${()=>i.onToggle(r.skillKey,r.disabled)}
              />
            </label>
            <span style="font-size: 13px; font-weight: 500;">
              ${r.disabled?`Disabled`:`Enabled`}
            </span>
            ${c?e`<button
                  class="btn"
                  ?disabled=${a}
                  @click=${()=>i.onInstall(r.skillKey,r.name,r.install[0].id)}
                >
                  ${a?`Installing…`:r.install[0].label}
                </button>`:n}
          </div>

          ${s?e`<div class="callout ${s.kind===`error`?`danger`:`success`}">
                ${s.message}
              </div>`:n}
          ${r.primaryEnv?e`
                <div style="display: grid; gap: 8px;">
                  <div class="field">
                    <span
                      >API key
                      <span class="muted" style="font-weight: normal; font-size: 0.88em;"
                        >(${r.primaryEnv})</span
                      ></span
                    >
                    <input
                      type="password"
                      .value=${o}
                      @input=${e=>i.onEdit(r.skillKey,e.target.value)}
                    />
                  </div>
                  ${(()=>{let t=m(r.homepage);return t?e`<div class="muted" style="font-size: 13px;">
                          Get your key:
                          <a href="${t}" target="_blank" rel="noopener noreferrer"
                            >${r.homepage}</a
                          >
                        </div>`:n})()}
                  <button
                    class="btn primary"
                    ?disabled=${a}
                    @click=${()=>i.onSaveKey(r.skillKey)}
                  >
                    Save key
                  </button>
                </div>
              `:n}

          <div
            style="border-top: 1px solid var(--border); padding-top: 12px; display: grid; gap: 6px; font-size: 12px; color: var(--muted);"
          >
            <div><span style="font-weight: 600;">Source:</span> ${r.source}</div>
            <div style="font-family: var(--mono); word-break: break-all;">${r.filePath}</div>
            ${(()=>{let t=m(r.homepage);return t?e`<div>
                    <a href="${t}" target="_blank" rel="noopener noreferrer"
                      >${r.homepage}</a
                    >
                  </div>`:n})()}
          </div>
        </div>
      </div>
    </dialog>
  `}function D(t,r,i){let a=t.clawhub;if(!a)return n;if(a.status===`invalid`)return e`<div class="callout danger">
      <div style="font-weight: 600; margin-bottom: 4px;">ClawHub link invalid</div>
      <div>${a.reason}</div>
    </div>`;let o=m(i?.securityAuditUrl??void 0),s=i?.reasons?.length?i.reasons.join(`, `):null;return e`
    <div
      class="callout"
      style="display: grid; gap: 8px; border-color: var(--border); background: var(--panel-2);"
    >
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="chip ${x(i)}">${b(i)}</span>
        <span class="muted" style="font-size: 12px;">${a.slug}@${a.installedVersion}</span>
        ${r.clawhubVerdictsLoading?e`<span class="muted">Refreshing…</span>`:n}
      </div>
      ${r.clawhubVerdictsError?e`<div class="muted" style="font-size: 13px;">${r.clawhubVerdictsError}</div>`:s?e`<div class="muted" style="font-size: 13px;">${s}</div>`:n}
      ${o?e`<div style="font-size: 13px;">
            <a href="${o}" target="_blank" rel="noopener noreferrer"
              >Full security report</a
            >
          </div>`:n}
    </div>
  `}function O(t,i){if(!t.skillCard?.present)return n;let a=i.skillCardContents[t.skillKey];if(a===void 0){let n=i.skillCardErrors[t.skillKey];return n?e`<div class="callout danger">${n}</div>`:e`<div class="muted" style="font-size: 13px;">
      ${i.skillCardLoadingKey===t.skillKey?`Loading Skill Card...`:`Skill Card not loaded.`}
    </div>`}return e`
    <article class="sidebar-markdown" style="max-width: 100%; overflow-wrap: anywhere;">
      ${r(c(a))}
    </article>
  `}export{S as renderSkills};
//# sourceMappingURL=skills-o_tR8yyF.js.map