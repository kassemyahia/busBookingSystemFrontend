(async () => {
  const ready = await window.ui.initProtectedLayout();

  if (!ready) {
    return;
  }

  const form = document.getElementById("tripSearchForm");

  const grid = document.getElementById("tripsGrid");

  const loading = document.getElementById("tripsLoading");

  function renderTrips(trips) {
    loading.classList.add("hidden");

    if (!Array.isArray(trips) || trips.length === 0) {
      grid.innerHTML = `
                <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center md:col-span-2 xl:col-span-3">

                    <p class="text-lg font-semibold text-slate-700">
                        No trips found
                    </p>

                    <p class="mt-2 text-sm text-slate-400">
                        Try changing your search filters.
                    </p>

                </div>
            `;

      return;
    }

    grid.innerHTML = trips
      .map((trip) => {
        const id = window.ui.pick(trip, "tripId", "TripId");

        const departure = window.ui.pick(
          trip,
          "departureTime",
          "DepartureTime",
        );

        const start = window.ui.pick(trip, "startCity", "StartCity");

        const end = window.ui.pick(trip, "endCity", "EndCity");

        const type = window.ui.pick(trip, "busType", "BusType");

        const price = window.ui.pick(trip, "basePrice", "BasePrice");

        const discount = window.ui.pick(trip, "discountName", "DiscountName");

        const percentage = window.ui.pick(
          trip,
          "discountPercentage",
          "DiscountPercentage",
        );

        return `
                    <article
                        class="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >

                        <div class="flex items-start justify-between gap-4">

                            <div>

                                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Trip #${window.ui.escapeHtml(id)}
                                </p>

                                <h2 class="mt-2 text-xl font-bold text-slate-950">
                                    ${window.ui.escapeHtml(start)}
                                    <span class="mx-1 text-slate-300">→</span>
                                    ${window.ui.escapeHtml(end)}
                                </h2>

                            </div>

                            <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                ${window.ui.escapeHtml(type || "Bus")}
                            </span>

                        </div>


                        <div class="mt-6 space-y-3 text-sm">

                            <div class="flex items-center justify-between">
                                <span class="text-slate-400">
                                    Departure
                                </span>

                                <span class="font-medium text-slate-700">
                                    ${window.ui.escapeHtml(departure)}
                                </span>
                            </div>


                            <div class="flex items-center justify-between">
                                <span class="text-slate-400">
                                    Price
                                </span>

                                <span class="font-semibold text-slate-950">
                                    ${window.ui.escapeHtml(price)}
                                </span>
                            </div>


                            <div class="flex items-center justify-between">
                                <span class="text-slate-400">
                                    Discount
                                </span>

                                <span class="font-medium text-emerald-600">
                                    ${window.ui.escapeHtml(discount || "No discount")}
                                    ${percentage ? `(${window.ui.escapeHtml(percentage)})` : ""}
                                </span>
                            </div>

                        </div>


                        <a
                            href="./trip-details.html?id=${encodeURIComponent(id)}"
                            class="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-slate-800"
                        >
                            View trip
                        </a>

                    </article>
                `;
      })
      .join("");
  }

  async function loadTrips(endpoint = "/api/Trip/all-trips") {
    loading.classList.remove("hidden");

    grid.innerHTML = "";

    window.ui.hideAlert("tripsAlert");

    try {
      const trips = await window.api.request(endpoint, {
        method: "GET",
        auth: true,
      });

      renderTrips(trips);
    } catch (error) {
      loading.classList.add("hidden");

      window.ui.showAlert("tripsAlert", "error", error.message);
    }
  }

  form.addEventListener(
    "submit",

    (event) => {
      event.preventDefault();

      const params = new URLSearchParams();

      const values = {
        startCity: document.getElementById("startCity").value.trim(),

        endCity: document.getElementById("endCity").value.trim(),

        date: document.getElementById("tripDate").value,

        busType: document.getElementById("busType").value.trim(),

        sortBy: document.getElementById("sortBy").value,

        order: document.getElementById("sortOrder").value,
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      loadTrips(`/api/Trip/search?${params.toString()}`);
    },
  );

  document.getElementById("resetSearch").addEventListener("click", () => {
    form.reset();

    loadTrips();
  });

  loadTrips();
})();
