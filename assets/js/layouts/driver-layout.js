(() => {
  async function init() {
    if (!auth.requireDriver()) return false;
    let user = auth.getUser() || {};
    try {
      user = await auth.driverMe();
      auth.updateStoredUser(user);
    } catch (error) {
      if (error.status === 401) {
        auth.clearSession();
        window.location.replace("../auth/driver-login.html");
        return false;
      }
      window.driverLayout.lastError = error;
    }
    const name =
      admin.pick(user, "fullName", "FullName") ||
      `${admin.pick(user, "firstName", "FirstName")} ${admin.pick(user, "lastName", "LastName")}`.trim() ||
      "Driver";
    const page = location.pathname.split("/").pop();
    const nav = [["driver-dashboard.html", "Dashboard"], ["driver-profile.html", "Profile"]].map(([path, label]) => `<a href="./${path}" class="rounded-lg px-3 py-2 text-sm font-semibold ${page === path ? "bg-teal-500 text-white" : "text-slate-200 hover:bg-white/10"}">${label}</a>`).join("");
    document.getElementById("driverShell").innerHTML =
      `<header class="sticky top-0 z-40 border-b border-white/10 bg-[#0A192F] text-white"><div class="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center gap-3 px-5 py-3 sm:px-6 lg:px-8"><a href="./driver-dashboard.html" class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-lg font-extrabold">B</span><span><strong class="block leading-none">BusBooking</strong><small class="mt-1 block text-[10px] uppercase tracking-[.18em] text-teal-300">Driver portal</small></span></a><nav class="order-3 flex w-full gap-1 sm:order-none sm:ml-5 sm:w-auto">${nav}</nav><div class="ml-auto flex items-center gap-3"><span class="hidden text-sm font-semibold md:block">${admin.esc(name)}</span><span class="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-teal-200 sm:inline">Driver</span><button id="driverLogout" class="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10">Sign out</button></div></div></header>`;
    document.getElementById("driverLogout").onclick = auth.logout;
    return true;
  }
  window.driverLayout = { init };
})();
