(() => {
  const pick = (o, ...names) =>
    names.map((n) => o?.[n]).find((v) => v !== undefined && v !== null) ?? null;
  const escapeHtml = (v) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const getQuery = (name) => new URLSearchParams(location.search).get(name);
  function showAlert(id, type, message) {
    const el = document.getElementById(id);
    if (!el) return;
    const colors = {
      success: "border-emerald-200 bg-emerald-50 text-emerald-800",
      error: "border-red-200 bg-red-50 text-red-800",
      warning: "border-amber-200 bg-amber-50 text-amber-900",
      info: "border-cyan-200 bg-teal-50 text-cyan-800",
    };
    el.className = `rounded-xl border px-4 py-3 text-sm ${colors[type] || colors.info}`;
    el.textContent = message;
  }
  function hideAlert(id) {
    document.getElementById(id)?.classList.add("hidden");
  }
  function formatDate(value) {
    if (!value) return "—";
    let clean = String(value);
    if (/^\d{4}-\d{2}-\d{2}:/.test(clean))
      clean = clean.slice(0, 10) + " " + clean.slice(11);
    const date = new Date(clean);
    return Number.isNaN(date.getTime()) ? clean : date.toLocaleString();
  }
  const page = () => location.pathname.split("/").pop();
  const navClass = (p) =>
    page() === p
      ? "bg-white/10 text-white"
      : "text-slate-300 hover:bg-white/10 hover:text-white";
  const fullName = (u) =>
    pick(u, "fullName", "FullName") ||
    `${pick(u, "firstName", "FirstName") || ""} ${pick(u, "lastName", "LastName") || ""}`.trim() ||
    "Passenger";
  const initials = (u) => {
    const n = fullName(u).split(" ");
    return ((n[0]?.[0] || "") + (n[1]?.[0] || "")).toUpperCase() || "P";
  };
  function renderHeader() {
    const root = document.getElementById("appHeader");
    if (!root) return;
    const user = auth.getUser();
    root.innerHTML = `<header class="sticky top-0 z-40 border-b border-white/10 bg-[#0A192F] text-white shadow-lg shadow-slate-950/10"><div class="mx-auto flex h-[72px] max-w-7xl items-center px-5 sm:px-6 lg:px-8"><a href="./trips.html" class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-lg font-extrabold">B</span><span><strong class="block leading-none">BusBooking</strong><small class="mt-1 block text-[10px] uppercase tracking-[.18em] text-teal-300">Intercity travel</small></span></a><nav class="ml-12 hidden items-center gap-1 md:flex"><a href="./trips.html" class="rounded-xl px-4 py-2.5 text-sm font-semibold ${navClass("trips.html")}">Find trips</a><a href="./tickets.html" class="rounded-xl px-4 py-2.5 text-sm font-semibold ${navClass("tickets.html")}">My tickets</a><a href="./profile.html" class="rounded-xl px-4 py-2.5 text-sm font-semibold ${navClass("profile.html")}">Profile</a></nav><div class="ml-auto flex items-center gap-3"><a href="./profile.html" class="hidden items-center gap-3 sm:flex"><span id="headerInitials" class="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-xs font-extrabold text-teal-800">${escapeHtml(initials(user))}</span><span id="headerName" class="max-w-36 truncate text-sm font-semibold">${escapeHtml(fullName(user))}</span></a><button id="logoutButton" class="hidden rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 md:block">Sign out</button><button id="mobileMenuButton" aria-label="Open navigation" class="grid h-10 w-10 place-items-center rounded-xl border border-white/20 md:hidden">☰</button></div></div><div id="mobileMenu" class="hidden border-t border-white/10 px-5 py-4 md:hidden"><a href="./trips.html" class="block rounded-xl px-3 py-2 ${navClass("trips.html")}">Find trips</a><a href="./tickets.html" class="mt-1 block rounded-xl px-3 py-2 ${navClass("tickets.html")}">My tickets</a><a href="./profile.html" class="mt-1 block rounded-xl px-3 py-2 ${navClass("profile.html")}">Profile</a><button id="mobileLogoutButton" class="mt-2 w-full rounded-xl px-3 py-2 text-left text-red-300">Sign out</button></div></header>`;
    document.getElementById("mobileMenuButton").onclick = () =>
      document.getElementById("mobileMenu").classList.toggle("hidden");
    document.getElementById("logoutButton").onclick = auth.logout;
    document.getElementById("mobileLogoutButton").onclick = auth.logout;
  }
  function renderFooter() {
    const root = document.getElementById("appFooter");
    if (root)
      root.innerHTML = `<footer class="border-t border-slate-200 bg-white"><div class="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-slate-400 sm:flex-row sm:justify-between sm:px-6 lg:px-8"><p>© ${new Date().getFullYear()} BusBooking</p><p>Reliable journeys. Simple booking.</p></div></footer>`;
  }
  async function initProtectedLayout() {
    if (!auth.requireUser()) return false;
    renderHeader();
    renderFooter();
    try {
      const user = await auth.me();
      auth.updateStoredUser(user);
      const n = document.getElementById("headerName"),
        i = document.getElementById("headerInitials");
      if (n) n.textContent = fullName(user);
      if (i) i.textContent = initials(user);
      return true;
    } catch (e) {
      if (e.status === 401) auth.clearSession();
      return e.status !== 401;
    }
  }
  window.ui = {
    pick,
    escapeHtml,
    getQuery,
    showAlert,
    hideAlert,
    formatDate,
    renderHeader,
    renderFooter,
    initProtectedLayout,
  };
})();
