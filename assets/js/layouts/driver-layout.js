(() => {
  async function init() {
    if (!auth.requireDriver()) return false;
    const user = auth.getUser() || {};
    const name =
      admin.pick(user, "fullName", "FullName") ||
      `${admin.pick(user, "firstName", "FirstName")} ${admin.pick(user, "lastName", "LastName")}`.trim() ||
      "Driver";
    document.getElementById("driverShell").innerHTML =
      `<header class="sticky top-0 z-40 border-b border-white/10 bg-[#0A192F] text-white"><div class="mx-auto flex h-[72px] max-w-7xl items-center px-5 sm:px-6 lg:px-8"><a href="./driver-dashboard.html" class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-lg font-extrabold">B</span><span><strong class="block leading-none">BusBooking</strong><small class="mt-1 block text-[10px] uppercase tracking-[.18em] text-teal-300">Driver portal</small></span></a><div class="ml-auto flex items-center gap-4"><span class="hidden text-sm font-semibold sm:block">${admin.esc(name)}</span><span class="rounded-full bg-white/10 px-3 py-1 text-xs text-teal-200">Driver</span><button id="driverLogout" class="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10">Sign out</button></div></div></header>`;
    document.getElementById("driverLogout").onclick = auth.logout;
    try {
      auth.updateStoredUser(await auth.driverMe());
    } catch {}
    return true;
  }
  window.driverLayout = { init };
})();
