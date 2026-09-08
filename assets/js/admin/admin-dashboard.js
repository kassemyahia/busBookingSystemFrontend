(async () => {
  if (!(await staffLayout.init())) return;
  const now = new Date();
  const q = `?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
  const requests = [
    "/api/employee/trips/trips/today",
    "/api/employee/trips/trips/tomorrow",
    "/api/employee/trips/trips/upcoming",
    "/api/employee/trips/trips/on-roads",
    `/api/employee/trips/trips/count/month${q}`,
    `/api/employee/trips/trips/count/year?year=${now.getFullYear()}`,
    "/api/employee/buses/buses/on-roads",
    "/api/employee/route-price/most-used-route-prices",
    "/api/employee/city/cities/most-used-trips",
    "/api/employee/trips/trips/count/route-price",
    "/api/employee/trips/trips/count/bus-type",
  ];
  const panelDefinitions = [
    {
      result: 7,
      id: "routes",
      title: "Frequently used routes",
      fields: [
        ["routePriceId", "RoutePriceId"],
        ["startCityName", "StartCityName"],
        ["endCityName", "EndCityName"],
        ["busTypeName", "BusTypeName"],
        ["usageCount", "UsageCount"],
      ],
      columns: [
        { label: "Route", keys: ["startCityName", "StartCityName"], format: (v, o) => `${v} → ${admin.pick(o, "endCityName", "EndCityName")}` },
        { label: "Bus type", keys: ["busTypeName", "BusTypeName"] },
        { label: "Uses", keys: ["usageCount", "UsageCount"] },
      ],
    },
    {
      result: 8,
      id: "cities",
      title: "Frequently used cities",
      fields: [["cityName", "CityName", "name", "Name"], ["usageCount", "UsageCount", "tripCount", "TripCount"]],
      columns: [
        { label: "City", keys: ["cityName", "CityName", "name", "Name"] },
        { label: "Uses", keys: ["usageCount", "UsageCount", "tripCount", "TripCount"] },
      ],
    },
    {
      result: 9,
      id: "tripsByRoute",
      title: "Trips by route price",
      fields: [["routePriceId", "RoutePriceId"], ["startCityName", "StartCityName"], ["endCityName", "EndCityName"], ["busTypeName", "BusTypeName"], ["tripsCount", "TripsCount", "count", "Count"]],
      columns: [
        { label: "Route ID", keys: ["routePriceId", "RoutePriceId"] },
        { label: "Route", keys: ["startCityName", "StartCityName"], format: (v, o) => `${v} → ${admin.pick(o, "endCityName", "EndCityName")}` },
        { label: "Bus type", keys: ["busTypeName", "BusTypeName"] },
        { label: "Trips", keys: ["tripsCount", "TripsCount", "tripCount", "TripCount", "count", "Count"] },
      ],
    },
    {
      result: 10,
      id: "tripsByBusType",
      title: "Trips by bus type",
      fields: [["busTypeName", "BusTypeName"], ["capacity", "Capacity"], ["tripsCount", "TripsCount", "count", "Count"]],
      columns: [
        { label: "Bus type", keys: ["busTypeName", "BusTypeName"] },
        { label: "Capacity", keys: ["capacity", "Capacity"] },
        { label: "Trips", keys: ["tripsCount", "TripsCount", "tripCount", "TripCount", "count", "Count"] },
      ],
    },
  ];

  document.getElementById("dashboardContent").innerHTML =
    `<div id="kpiGrid" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"></div><div id="dashboardPanels" class="mt-8 grid items-start gap-6 xl:grid-cols-2">${panelDefinitions.map((item) => dashboardPanels.panel({ id: `${item.id}Panel`, title: item.title })).join("")}</div>`;
  dashboardPanels.init(document.getElementById("dashboardPanels"));
  admin.setLoading(true);
  const results = await Promise.allSettled(requests.map((path) => admin.request(path)));
  admin.setLoading(false);

  const countValue = (result, list = false) => {
    if (result.status !== "fulfilled") return null;
    if (list) return api.asArray(result.value).length;
    const value = Number(admin.pick(result.value, "count", "Count"));
    return Number.isFinite(value) ? value : 0;
  };
  const kpis = [
    ["Trips today", 0, true], ["Tomorrow", 1, true], ["Upcoming", 2, true],
    ["On road", 3, true], ["This month", 4, false], ["This year", 5, false],
    ["Buses on road", 6, true],
  ];
  document.getElementById("kpiGrid").innerHTML = kpis.map(([label, index, list]) => {
    const value = countValue(results[index], list);
    return `<article class="min-h-32 rounded-2xl border bg-white p-5 shadow-sm"><p class="text-sm text-slate-500">${label}</p>${value === null ? `<p class="mt-3 text-sm font-semibold text-red-700">Unavailable</p>` : `<p class="mt-2 text-3xl font-bold">${value}</p>`}</article>`;
  }).join("");

  const datasets = new Map();
  panelDefinitions.forEach((definition) => {
    const result = results[definition.result];
    const bodyId = `${definition.id}Body`;
    const body = document.querySelector(`#${definition.id}Panel [data-panel-body]`);
    body.id = bodyId;
    if (result.status === "rejected") {
      body.innerHTML = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">${admin.esc(result.reason?.message || "This panel could not be loaded.")}</div>`;
      return;
    }
    datasets.set(definition.id, api.asArray(result.value));
  });

  let search;
  const render = (query = "") => {
    let shown = 0;
    let total = 0;
    panelDefinitions.forEach((definition) => {
      if (!datasets.has(definition.id)) return;
      const source = datasets.get(definition.id);
      const filtered = searchUtils.filterRows(source, query, definition.fields);
      total += source.length;
      shown += filtered.length;
      admin.table(`${definition.id}Body`, filtered, definition.columns, null, query.trim() ? "No matching results." : "No data available.");
    });
    search?.setCount(shown, total);
  };
  search = searchUtils.createSearch({ mount: "dashboardSearch", id: "dashboardQuery", placeholder: "Search routes, cities, bus types, IDs or counts…", onChange: render });
  render();
})();
