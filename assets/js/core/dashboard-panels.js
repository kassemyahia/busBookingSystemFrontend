(() => {
  function panel({ id, title, content = "Loading…" }) {
    return `<section id="${id}" class="dashboard-panel rounded-2xl border border-slate-200 bg-white shadow-sm"><header class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><h2 class="text-lg font-bold">${title}</h2><button type="button" data-panel-toggle aria-expanded="false" class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-50">Expand</button></header><div data-panel-body class="dashboard-panel-body overflow-auto p-4">${content}</div></section>`;
  }
  function init(root = document) {
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-panel-toggle]");
      if (!button || !root.contains(button)) return;
      const card = button.closest(".dashboard-panel");
      const expanded = card.classList.toggle("dashboard-panel-expanded");
      button.textContent = expanded ? "Collapse" : "Expand";
      button.setAttribute("aria-expanded", String(expanded));
      if (expanded) {
        card.setAttribute("role", "dialog");
        card.setAttribute("aria-modal", "true");
        button.focus();
      } else {
        card.removeAttribute("role");
        card.removeAttribute("aria-modal");
      }
      document.body.classList.toggle("dashboard-panel-open", expanded);
      if (!expanded) card.scrollIntoView({ block: "nearest" });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const card = root.querySelector(".dashboard-panel-expanded");
      card?.querySelector("[data-panel-toggle]")?.click();
    });
  }
  window.dashboardPanels = { panel, init };
})();
