(() => {
  const managerOnly = new Set([
    "admin-employees.html",
    "admin-trip-discounts.html",
    "admin-user-discounts.html",
    "admin-user-discount-tickets.html",
  ]);
  const links = [
    ["admin-dashboard.html", "Dashboard"],
    ["admin-trips.html", "Trips"],
    ["admin-buses.html", "Buses"],
    ["admin-bus-types.html", "Bus Types"],
    ["admin-cities.html", "Cities"],
    ["admin-route-prices.html", "Route Prices"],
    ["admin-employees.html", "Employees"],
    ["admin-trip-discounts.html", "Trip Discounts"],
    ["admin-user-discounts.html", "User Discounts"],
    ["admin-user-discount-tickets.html", "Discount Tickets"],
  ];
  async function init() {
    if (!auth.requireEmployee()) return false;
    const page = location.pathname.split("/").pop();
    if (managerOnly.has(page) && !auth.requireManager()) return false;
    const role = auth.getRole(),
      entity = auth.getUser() || {},
      name =
        admin.pick(entity, "fullName", "FullName") ||
        `${admin.pick(entity, "firstName", "FirstName")} ${admin.pick(entity, "lastName", "LastName")}`.trim() ||
        "Employee";
    const nav = links
      .filter(([p]) => role === "Manager" || !managerOnly.has(p))
      .map(
        ([p, l]) =>
          `<a href="./${p}" class="block rounded-xl px-4 py-2.5 text-sm font-medium ${p === page ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-white/10"}">${l}</a>`,
      )
      .join("");
    document.getElementById("staffShell").innerHTML =
      `<aside id="staffSidebar" class="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-y-auto bg-[#0A192F] p-5 shadow-2xl lg:block"><a href="./admin-dashboard.html" class="mb-8 flex items-center gap-3 text-white"><span class="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 font-extrabold">B</span><span><strong class="block">BusBooking</strong><small class="text-[10px] uppercase tracking-widest text-teal-300">Operations</small></span></a><nav class="space-y-1">${nav}</nav></aside><header class="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur lg:ml-64"><button id="staffMenu" aria-label="Open navigation" class="rounded-xl border px-3 py-2 lg:hidden">☰</button><div class="ml-auto flex items-center gap-4"><div class="text-right"><p class="text-sm font-semibold">${admin.esc(name)}</p><p class="text-xs font-medium text-teal-700">${admin.esc(role)}</p></div><button id="staffLogout" class="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50">Sign out</button></div></header>`;
    document.body.classList.add("lg:pl-0");
    document.getElementById("staffMenu").onclick = () =>
      document.getElementById("staffSidebar").classList.toggle("hidden");
    document.getElementById("staffLogout").onclick = auth.logout;
    try {
      const me = await auth.employeeMe();
      auth.updateStoredUser(me);
    } catch (e) {
      if (e.status === 401) return false;
    }
    return true;
  }
  window.staffLayout = { init };
})();
