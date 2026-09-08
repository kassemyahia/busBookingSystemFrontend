(async () => {
  if (!(await driverLayout.init())) return;
  const now = new Date();
  const periods = ["Today", "Tomorrow", "After tomorrow"];
  const columns = [
    { label: "Trip ID", keys: ["tripId", "TripId"] },
    { label: "Departure", keys: ["departureTime", "DepartureTime"], format: admin.fmt },
    { label: "Arrival", keys: ["arrivalTime", "ArrivalTime"], format: admin.fmt },
    { label: "Route", keys: ["startCity", "StartCity"], format: (v, trip) => `${v} → ${admin.pick(trip, "endCity", "EndCity")}` },
    { label: "Bus", keys: ["busNumber", "BusNumber", "busId", "BusId"] },
    { label: "Status", keys: ["status", "Status"] },
  ];
  const fields = columns.map((column) => column.keys);
  document.getElementById("tripsRoot").innerHTML = periods.map((title, index) => dashboardPanels.panel({ id: `driverPanel${index}`, title })).join("");
  periods.forEach((_, index) => document.querySelector(`#driverPanel${index} [data-panel-body]`).id = `driverTrips${index}`);
  dashboardPanels.init(document.getElementById("tripsRoot"));
  admin.setLoading(true);
  const results = await Promise.allSettled([
    admin.request("/api/driver-dashboard/today-trip-driver"),
    admin.request("/api/driver-dashboard/tomorrow-trip-driver"),
    admin.request("/api/driver-dashboard/after-tomorrow"),
    admin.request(`/api/driver-dashboard/monthly/${now.getFullYear()}/${now.getMonth() + 1}`),
    admin.request(`/api/driver-dashboard/yearly/${now.getFullYear()}`),
  ]);
  admin.setLoading(false);
  const count = (result) => {
    if (result.status !== "fulfilled") return null;
    if (typeof result.value === "number") return result.value;
    const value = Number(admin.pick(result.value, "count", "Count"));
    return Number.isFinite(value) ? value : 0;
  };
  document.getElementById("statsRoot").innerHTML = `<div class="grid gap-4 sm:grid-cols-2">${[["Trips this month", results[3]], ["Trips this year", results[4]]].map(([label, result]) => { const value = count(result); return `<article class="min-h-32 rounded-2xl border bg-white p-5"><p class="text-sm text-slate-500">${label}</p>${value === null ? `<p class="mt-3 text-sm font-semibold text-red-700">${admin.esc(result.reason?.message || "Unavailable")}</p>` : `<p class="mt-2 text-3xl font-bold">${value}</p>`}</article>`; }).join("")}</div>`;
  const datasets = results.slice(0, 3).map((result, index) => {
    if (result.status === "fulfilled") return api.asArray(result.value);
    document.getElementById(`driverTrips${index}`).innerHTML = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">${admin.esc(result.reason?.message || `${periods[index]} trips could not be loaded.`)}</div>`;
    return null;
  });
  let search;
  const render = (query = "") => {
    let shown = 0, total = 0;
    datasets.forEach((source, index) => {
      if (!source) return;
      const filtered = searchUtils.filterRows(source, query, fields);
      shown += filtered.length; total += source.length;
      admin.table(`driverTrips${index}`, filtered, columns, null, query.trim() ? "No matching results." : "No assigned trips.");
    });
    search?.setCount(shown, total);
  };
  search = searchUtils.createSearch({ mount: "driverSearch", id: "driverTripQuery", placeholder: "Search trip ID, route, city, bus, status or time…", onChange: render });
  render();
})();
