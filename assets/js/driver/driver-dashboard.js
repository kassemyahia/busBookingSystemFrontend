(async () => {
  if (!(await driverLayout.init())) return;

  const me = auth.getUser() || {};
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const profileRoot = document.getElementById("profileRoot");
  const statsRoot = document.getElementById("statsRoot");
  const tripsRoot = document.getElementById("tripsRoot");

  profileRoot.innerHTML = `<section class="rounded-2xl border bg-white p-5 shadow-sm"><h2 class="text-xl font-bold">${admin.esc(admin.pick(me, "fullName", "FullName"))}</h2><p class="mt-2 text-sm text-slate-600">Phone: ${admin.esc(admin.pick(me, "phone", "Phone"))} · License: ${admin.esc(admin.pick(me, "licenseNumber", "LicenseNumber"))} · Status: ${admin.esc(admin.pick(me, "status", "Status"))} · Hired: ${admin.esc(admin.fmt(admin.pick(me, "hireDate", "HireDate")))}</p></section>`;

  statsRoot.innerHTML =
    '<div class="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-400">Loading trip statistics…</div>';
  const periods = ["Today", "Tomorrow", "After tomorrow"];
  tripsRoot.innerHTML = periods
    .map(
      (name, index) =>
        `<section><h2 class="mb-3 text-xl font-bold">${name}</h2><div id="driverTrips${index}" class="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-400">Loading trips…</div></section>`,
    )
    .join("");

  const results = await Promise.allSettled([
    admin.request("/api/driver-dashboard/today-trip-driver"),
    admin.request("/api/driver-dashboard/tomorrow-trip-driver"),
    admin.request("/api/driver-dashboard/after-tomorrow"),
    admin.request(`/api/driver-dashboard/monthly/${year}/${month}`),
    admin.request(`/api/driver-dashboard/yearly/${year}`),
  ]);
  admin.setLoading(false);

  const count = (result) => {
    if (result.status !== "fulfilled") return null;
    const value = result.value;
    if (typeof value === "number") return value;
    const picked = admin.pick(value, "count", "Count");
    const parsed = Number(picked);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const monthly = count(results[3]);
  const yearly = count(results[4]);
  const statCard = (label, value, result) =>
    `<div class="rounded-2xl border bg-white p-5"><p class="text-sm text-slate-500">${label}</p>${value === null ? `<p class="mt-2 text-sm font-semibold text-red-700">${admin.esc(result.reason?.message || "Statistic unavailable")}</p>` : `<p class="mt-2 text-3xl font-bold">${value}</p>`}</div>`;
  statsRoot.innerHTML = `<div class="grid gap-4 sm:grid-cols-2">${statCard("Trips this month", monthly, results[3])}${statCard("Trips this year", yearly, results[4])}</div>`;

  const columns = [
    { label: "Trip ID", keys: ["tripId", "TripId"] },
    {
      label: "Departure",
      keys: ["departureTime", "DepartureTime"],
      format: admin.fmt,
    },
    {
      label: "Arrival",
      keys: ["arrivalTime", "ArrivalTime"],
      format: admin.fmt,
    },
    {
      label: "Route",
      keys: ["startCity", "StartCity"],
      format: (value, trip) =>
        `${value} → ${admin.pick(trip, "endCity", "EndCity")}`,
    },
    { label: "Bus", keys: ["busNumber", "BusNumber"] },
  ];

  results.slice(0, 3).forEach((result, index) => {
    const root = document.getElementById(`driverTrips${index}`);
    root.className = "";
    if (result.status === "rejected") {
      root.innerHTML = `<div class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">${admin.esc(result.reason?.message || `${periods[index]} trips could not be loaded.`)}</div>`;
      return;
    }
    admin.table(`driverTrips${index}`, result.value, columns);
  });
})();
