(async () => {
  if (!(await staffLayout.init())) return;
  const now = new Date(),
    q = `?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
  try {
    const [
      today,
      tomorrow,
      upcoming,
      road,
      month,
      year,
      buses,
      routes,
      cities,
    ] = await Promise.all([
      admin.request("/api/employee/trips/trips/today"),
      admin.request("/api/employee/trips/trips/tomorrow"),
      admin.request("/api/employee/trips/trips/upcoming"),
      admin.request("/api/employee/trips/trips/on-roads"),
      admin.request(`/api/employee/trips/trips/count/month${q}`),
      admin.request(
        `/api/employee/trips/trips/count/year?year=${now.getFullYear()}`,
      ),
      admin.request("/api/employee/buses/buses/on-roads"),
      admin.request("/api/employee/route-price/most-used-route-prices"),
      admin.request("/api/employee/city/cities/most-used-trips"),
    ]);
    admin.setLoading(false);
    const cards = [
      ["Trips today", api.asArray(today).length],
      ["Tomorrow", api.asArray(tomorrow).length],
      ["Upcoming", api.asArray(upcoming).length],
      ["On road", api.asArray(road).length],
      ["This month", admin.pick(month, "count", "Count")],
      ["This year", admin.pick(year, "count", "Count")],
      ["Buses on road", api.asArray(buses).length],
    ];
    document.getElementById("dashboardContent").innerHTML =
      `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${cards.map(([l, v]) => `<article class="rounded-2xl border bg-white p-5 shadow-sm"><p class="text-sm text-slate-500">${l}</p><p class="mt-2 text-3xl font-bold">${v || 0}</p></article>`).join("")}</div><div class="mt-8 grid gap-6 xl:grid-cols-2"><section><h2 class="mb-3 text-xl font-bold">Frequently used routes</h2><div id="routes"></div></section><section><h2 class="mb-3 text-xl font-bold">Frequently used cities</h2><div id="cities"></div></section></div>`;
    admin.table("routes", routes, [
      {
        label: "Route",
        keys: ["startCityName", "StartCityName"],
        format: (v, o) =>
          `${v} → ${admin.pick(o, "endCityName", "EndCityName")}`,
      },
      { label: "Bus type", keys: ["busTypeName", "BusTypeName"] },
      { label: "Uses", keys: ["usageCount", "UsageCount"] },
    ]);
    admin.table("cities", cities, [
      { label: "City", keys: ["cityName", "CityName", "name", "Name"] },
      {
        label: "Uses",
        keys: ["usageCount", "UsageCount", "tripCount", "TripCount"],
      },
    ]);
  } catch (e) {
    admin.setLoading(false);
    admin.alert(e.message);
  }
})();
