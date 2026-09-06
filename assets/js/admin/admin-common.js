(() => {
  const pick = (o, ...keys) =>
    keys.map((k) => o?.[k]).find((v) => v !== undefined && v !== null) ?? "";
  const esc = (v) =>
    String(v ?? "—")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const fmt = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  };
  function alert(message, type = "error") {
    const e = document.getElementById("pageAlert");
    if (!e) return;
    e.textContent = message;
    e.className = `mb-5 rounded-xl border px-4 py-3 text-sm ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`;
  }
  function setLoading(loading, text = "Loading…") {
    const e = document.getElementById("loadingState");
    if (e) {
      e.textContent = text;
      e.classList.toggle("hidden", !loading);
    }
  }
  function rows(data, columns, actions) {
    const list = api.asArray(data);
    if (!list.length)
      return `<tr><td colspan="${columns.length + (actions ? 1 : 0)}" class="px-5 py-10 text-center text-slate-400">No data available.</td></tr>`;
    return list
      .map(
        (item) =>
          `<tr class="border-t border-slate-100">${columns.map((c) => `<td class="whitespace-nowrap px-5 py-3 text-sm text-slate-600">${esc(c.format ? c.format(pick(item, ...c.keys), item) : pick(item, ...c.keys))}</td>`).join("")}${actions ? `<td class="whitespace-nowrap px-5 py-3">${actions(item)}</td>` : ""}</tr>`,
      )
      .join("");
  }
  function table(target, data, columns, actions) {
    document.getElementById(target).innerHTML =
      `<div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table class="w-full text-left"><thead class="bg-slate-50"><tr>${columns.map((c) => `<th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">${esc(c.label)}</th>`).join("")}${actions ? '<th class="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Actions</th>' : ""}</tr></thead><tbody>${rows(data, columns, actions)}</tbody></table></div>`;
  }
  function openModal(title, body, onSubmit) {
    const root = document.getElementById("modalRoot");
    root.innerHTML = `<div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div class="mb-5 flex items-center justify-between"><h2 class="text-xl font-bold">${esc(title)}</h2><button data-close class="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100">✕</button></div><form id="modalForm" class="space-y-4">${body}<div id="modalError" class="hidden rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"></div><div class="flex justify-end gap-3"><button type="button" data-close class="rounded-xl border px-4 py-2">Cancel</button><button id="modalSubmit" class="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white">Save</button></div></form></div></div>`;
    root
      .querySelectorAll("[data-close]")
      .forEach((b) => (b.onclick = () => (root.innerHTML = "")));
    root.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const b = document.getElementById("modalSubmit");
      b.disabled = true;
      b.textContent = "Saving…";
      try {
        await onSubmit(new FormData(e.target));
        root.innerHTML = "";
      } catch (err) {
        const box = document.getElementById("modalError");
        box.textContent = err.message;
        box.classList.remove("hidden");
        b.disabled = false;
        b.textContent = "Save";
      }
    };
  }
  const input = (name, label, type = "text", value = "", attrs = "required") =>
    `<label class="block"><span class="mb-1 block text-sm font-semibold text-slate-700">${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value)}" ${attrs} class="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"></label>`;
  const select = (name, label, options, selected = "", optional = false) =>
    `<label class="block"><span class="mb-1 block text-sm font-semibold text-slate-700">${esc(label)}</span><select name="${name}" ${optional ? "" : "required"} class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="">${optional ? "None" : "Select…"}</option>${options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(selected) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select></label>`;
  async function request(path, options) {
    return api.request(path, { auth: true, ...options });
  }
  async function confirmAction(message, action) {
    if (!window.confirm(message)) return;
    try {
      await action();
      alert("Operation completed successfully.", "success");
    } catch (e) {
      alert(e.message);
    }
  }
  window.admin = {
    pick,
    esc,
    fmt,
    alert,
    setLoading,
    table,
    openModal,
    input,
    select,
    request,
    confirmAction,
  };
})();
