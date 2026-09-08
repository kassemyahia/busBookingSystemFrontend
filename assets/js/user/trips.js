(async () => {
  if (!(await window.ui.initProtectedLayout())) return;
  const form = document.getElementById("tripSearchForm");
  const grid = document.getElementById("tripsGrid");
  const loading = document.getElementById("tripsLoading");
  const start = document.getElementById("startCity");
  const end = document.getElementById("endCity");
  let defaultSortValue = "date";
  let tripOptionsPromise;
  let sourceTrips = [];
  let tripSearch;

  function getTripOptions() {
    tripOptionsPromise ??= api.request("/api/Trip/search-options", {
      auth: true,
    });
    return tripOptionsPromise;
  }

  async function loadSearchOptions() {
    const fill = (select, options) => {
      select.innerHTML = options
          .map((option) => {
            const key = ui.pick(option, "key", "Key");
            const label = ui.pick(option, "label", "Label");
            return `<option value="${ui.escapeHtml(key)}">${ui.escapeHtml(label)}</option>`;
          })
          .join("");
    };

    try {
      const [sortOptions, orderOptions] = await Promise.all([
        api.request("/api/SortBy/options", { auth: true }),
        api.request("/api/SortOptions/order", { auth: true }),
      ]);
      const validSortOptions = api.asArray(sortOptions).filter((option) => {
        const key = ui.pick(option, "key", "Key");
        const label = ui.pick(option, "label", "Label");
        return ![key, label].some(
          (value) =>
            String(value || "").trim().toLowerCase() === "recommended",
        );
      });
      if (
        !validSortOptions.some(
          (option) =>
            String(ui.pick(option, "key", "Key") || "").toLowerCase() ===
            "date",
        )
      ) {
        validSortOptions.unshift({ key: "date", label: "Date" });
      }
      const sortSelect = document.getElementById("sortBy");
      fill(sortSelect, validSortOptions);
      const dateOption = Array.from(sortSelect.options).find(
        (option) => option.value.toLowerCase() === "date",
      );
      defaultSortValue = dateOption?.value || "date";
      sortSelect.value = defaultSortValue;
      fill(document.getElementById("sortOrder"), api.asArray(orderOptions));
    } catch {
      // The HTML options remain as a compatible fallback if metadata is unavailable.
    }
  }

  async function loadBusTypes() {
    const select = document.getElementById("busType");
    try {
      const response = await getTripOptions();
      const seen = new Set();
      const names = api
        .asArray(ui.pick(response, "busTypes", "BusTypes"))
        .map((type) =>
          typeof type === "string"
            ? type
            : ui.pick(
                type,
                "name",
                "Name",
                "type",
                "Type",
                "busTypeName",
                "BusTypeName",
              ),
        )
        .map((name) => String(name || "").trim())
        .filter((name) => {
          const key = name.toLowerCase();
          if (!name || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      select.innerHTML = `<option value="">Any bus type</option>${names
        .map(
          (name) =>
            `<option value="${ui.escapeHtml(name)}">${ui.escapeHtml(name)}</option>`,
        )
        .join("")}`;
    } catch {
      // Keep the usable "Any bus type" fallback when metadata is unavailable.
    }
  }

  const cityName = (city) => window.ui.pick(city, "name", "Name");
  function fillCities(select, cities, label) {
    select.innerHTML = `<option value="">${label}</option>${cities.map((c) => `<option value="${window.ui.escapeHtml(cityName(c))}">${window.ui.escapeHtml(cityName(c))}</option>`).join("")}`;
    select.disabled = false;
  }
  async function loadCities() {
    try {
      const data = await getTripOptions();
      const cities = api.asArray(ui.pick(data, "cities", "Cities"));
      fillCities(start, cities, "Any departure city");
      fillCities(end, cities, "Any destination city");
    } catch (error) {
      fillCities(start, [], "Cities unavailable");
      fillCities(end, [], "Cities unavailable");
      ui.showAlert(
        "tripsAlert",
        "warning",
        `City filters could not be loaded: ${error.message}`,
      );
    }
  }
  function renderTrips(data, noMatch = false) {
    loading.classList.add("hidden");
    const trips = api.asArray(data);
    const popularRoot = document.getElementById("popularRoutes");
    if (popularRoot && !popularRoot.dataset.ready && trips.length) {
      const routes = [];
      trips.forEach((trip) => {
        const from = ui.pick(trip, "startCity", "StartCity"),
          to = ui.pick(trip, "endCity", "EndCity");
        if (from && to && !routes.some((r) => r.from === from && r.to === to))
          routes.push({ from, to });
      });
      popularRoot.innerHTML = `<span class="mr-1 text-xs font-bold uppercase tracking-wide text-slate-400">Popular routes</span>${routes
        .slice(0, 4)
        .map(
          (r, i) =>
            `<button type="button" data-route="${i}" class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-teal-300 hover:text-teal-700">${ui.escapeHtml(r.from)} → ${ui.escapeHtml(r.to)}</button>`,
        )
        .join("")}`;
      popularRoot.querySelectorAll("[data-route]").forEach(
        (button) =>
          (button.onclick = () => {
            const route = routes[Number(button.dataset.route)];
            start.value = route.from;
            end.value = route.to;
            form.requestSubmit();
          }),
      );
      popularRoot.dataset.ready = "true";
    }
    if (!trips.length) {
      grid.innerHTML = `<div class="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center"><div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-2xl">⌕</div><h3 class="mt-4 text-lg font-bold">${noMatch ? "No matching results" : "No trips found"}</h3><p class="mt-2 text-sm text-slate-500">${noMatch ? "Clear the text search or try another term." : "Adjust your route or travel date and search again."}</p></div>`;
      return;
    }
    grid.innerHTML = trips
      .map((trip) => {
        const id = ui.pick(trip, "tripId", "TripId"),
          departure = ui.pick(trip, "departureTime", "DepartureTime"),
          origin = ui.pick(trip, "startCity", "StartCity"),
          destination = ui.pick(trip, "endCity", "EndCity"),
          type = ui.pick(trip, "busType", "BusType"),
          price = ui.pick(trip, "basePrice", "BasePrice"),
          discount = ui.pick(trip, "discountName", "DiscountName"),
          percentage = ui.pick(
            trip,
            "discountPercentage",
            "DiscountPercentage",
          );
        const parts = String(departure || "").split(" ");
        return `<article class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"><div class="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-amber-400"></div><div class="grid items-center gap-6 p-6 lg:grid-cols-[1fr_1.5fr_auto]"><div><span class="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">${ui.escapeHtml(type || "Scheduled coach")}</span><p class="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Trip #${ui.escapeHtml(id)}</p><p class="mt-1 text-sm text-slate-500">${ui.escapeHtml(parts[0] || departure)}</p></div><div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4"><div><p class="tabular text-2xl font-extrabold text-slate-950">${ui.escapeHtml(parts[1] || "—")}</p><p class="mt-1 font-semibold">${ui.escapeHtml(origin)}</p></div><div class="flex items-center gap-2 text-teal-600"><span class="h-px w-8 bg-teal-200 sm:w-16"></span><span>→</span><span class="h-px w-8 bg-teal-200 sm:w-16"></span></div><div class="text-right"><p class="text-xs font-bold uppercase tracking-wide text-slate-400">Destination</p><p class="mt-2 font-semibold">${ui.escapeHtml(destination)}</p></div></div><div class="border-t border-slate-100 pt-5 text-left lg:min-w-48 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:text-right"><p class="text-xs uppercase tracking-wide text-slate-400">Fare</p><p class="tabular mt-1 text-2xl font-extrabold">${ui.escapeHtml(price)}</p>${discount && String(discount).toLowerCase() !== "no discount" ? `<p class="mt-1 text-xs font-semibold text-emerald-600">${ui.escapeHtml(discount)} ${ui.escapeHtml(percentage || "")}</p>` : ""}<a href="./trip-details.html?id=${encodeURIComponent(id)}" class="mt-4 inline-flex w-full justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700">Select seats</a></div></div></article>`;
      })
      .join("");
  }
  function applyTextSearch(query = "") {
    const filtered = searchUtils.filterRows(sourceTrips, query, [
      ["tripId", "TripId"], ["startCity", "StartCity"], ["endCity", "EndCity"],
      ["busType", "BusType"], ["departureTime", "DepartureTime"],
      ["discountName", "DiscountName"], ["basePrice", "BasePrice"],
    ]);
    renderTrips(filtered, Boolean(query.trim()));
    tripSearch?.setCount(filtered.length, sourceTrips.length);
  }
  async function loadTrips(endpoint = "/api/Trip/all-trips") {
    loading.classList.remove("hidden");
    grid.innerHTML = "";
    ui.hideAlert("tripsAlert");
    try {
      sourceTrips = api.asArray(await api.request(endpoint, { auth: true })).slice();
      applyTextSearch(tripSearch?.query() || "");
    } catch (e) {
      loading.classList.add("hidden");
      ui.showAlert("tripsAlert", "error", e.message);
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = {
      startCity: start.value,
      endCity: end.value,
      date: document.getElementById("tripDate").value,
      busType: document.getElementById("busType").value,
      sortBy: document.getElementById("sortBy").value || defaultSortValue,
      order: document.getElementById("sortOrder").value,
    };
    if (values.startCity && values.startCity === values.endCity) {
      ui.showAlert(
        "tripsAlert",
        "warning",
        "Departure and destination cities must be different.",
      );
      return;
    }
    const params = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => v && params.set(k, v));
    loadTrips(`/api/Trip/search?${params}`);
  });
  document.getElementById("resetSearch").onclick = () => {
    form.reset();
    document.getElementById("sortBy").value = defaultSortValue;
    form.requestSubmit();
  };
  document.getElementById("swapCities").onclick = () => {
    const value = start.value;
    start.value = end.value;
    end.value = value;
  };
  document.getElementById("mobileFilters").onclick = () =>
    document.getElementById("advancedFilters").classList.toggle("hidden");
  await Promise.all([
    loadCities(),
    loadSearchOptions(),
    loadBusTypes(),
  ]);
  tripSearch = searchUtils.createSearch({ mount: "tripTextSearch", id: "tripTextQuery", placeholder: "Search loaded trips by route, bus type, ID, date, discount or price…", onChange: applyTextSearch });
  form.requestSubmit();
})();
