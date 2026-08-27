(async () => {
  const ready = await window.ui.initProtectedLayout();

  if (!ready) {
    return;
  }

  const tripId = window.ui.getQuery("id");

  if (!tripId) {
    window.location.replace("./trips.html");

    return;
  }

  const summary = document.getElementById("tripSummary");

  const seatsGrid = document.getElementById("seatsGrid");

  const seatLoading = document.getElementById("seatLoading");

  function isAvailable(status) {
    return Number(status) === 1 || String(status).toLowerCase() === "available";
  }

  function seatStyle(status) {
    const number = Number(status);

    const text = String(status).toLowerCase();

    if (number === 1 || text === "available") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer";
    }

    if (number === 2 || text === "reserved") {
      return "border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed";
    }

    return "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed";
  }

  function renderTrip(trip) {
    const start = window.ui.pick(trip, "startCity", "StartCity");

    const end = window.ui.pick(trip, "endCity", "EndCity");

    const departure = window.ui.pick(trip, "departureTime", "DepartureTime");

    const busNumber = window.ui.pick(trip, "busNumber", "BusNumber");

    const busType = window.ui.pick(trip, "busType", "BusType");

    const seats = window.ui.pick(trip, "availableSeats", "AvailableSeats");

    const price = window.ui.pick(trip, "basePrice", "BasePrice");

    const driver = window.ui.pick(trip, "driverName", "DriverName");

    const status = window.ui.pick(trip, "tripStatus", "TripStatus");

    const discount = window.ui.pick(trip, "discountName", "DiscountName");

    summary.innerHTML = `
            <div class="overflow-hidden rounded-3xl bg-slate-950 text-white">

                <div class="p-7 sm:p-9">

                    <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <div class="mb-3 flex flex-wrap gap-2">

                                <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                                    ${window.ui.escapeHtml(busType)}
                                </span>

                                <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                                    ${window.ui.escapeHtml(status)}
                                </span>

                            </div>

                            <h1 class="text-3xl font-bold sm:text-4xl">
                                ${window.ui.escapeHtml(start)}
                                <span class="mx-2 text-slate-500">→</span>
                                ${window.ui.escapeHtml(end)}
                            </h1>

                            <p class="mt-3 text-slate-400">
                                ${window.ui.escapeHtml(departure)}
                            </p>

                        </div>

                        <div class="lg:text-right">

                            <p class="text-sm text-slate-400">
                                Starting price
                            </p>

                            <p class="mt-1 text-3xl font-bold">
                                ${window.ui.escapeHtml(price)}
                            </p>

                        </div>

                    </div>


                    <div class="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">

                        <div>
                            <p class="text-xs text-slate-500">
                                Bus
                            </p>

                            <p class="mt-1 font-semibold">
                                ${window.ui.escapeHtml(busNumber)}
                            </p>
                        </div>

                        <div>
                            <p class="text-xs text-slate-500">
                                Driver
                            </p>

                            <p class="mt-1 font-semibold">
                                ${window.ui.escapeHtml(driver)}
                            </p>
                        </div>

                        <div>
                            <p class="text-xs text-slate-500">
                                Available seats
                            </p>

                            <p class="mt-1 font-semibold">
                                ${window.ui.escapeHtml(seats)}
                            </p>
                        </div>

                        <div>
                            <p class="text-xs text-slate-500">
                                Discount
                            </p>

                            <p class="mt-1 font-semibold">
                                ${window.ui.escapeHtml(discount || "No discount")}
                            </p>
                        </div>

                    </div>

                </div>

            </div>
        `;
  }

  function renderSeats(seats) {
    seatLoading.classList.add("hidden");

    if (!Array.isArray(seats) || seats.length === 0) {
      seatsGrid.innerHTML = `
                <p class="col-span-full py-10 text-center text-sm text-slate-400">
                    No seat information available.
                </p>
            `;

      return;
    }

    seatsGrid.innerHTML = seats
      .map((seat) => {
        const number = window.ui.pick(seat, "seatNumber", "SeatNumber");

        const status = window.ui.pick(seat, "status", "Status");

        const available = isAvailable(status);

        return `
                    <button
                        type="button"
                        data-seat="${window.ui.escapeHtml(number)}"
                        ${available ? "" : "disabled"}
                        class="seat-button rounded-xl border px-3 py-4 text-sm font-bold transition ${seatStyle(status)}"
                    >
                        ${window.ui.escapeHtml(number)}
                    </button>
                `;
      })
      .join("");

    document
      .querySelectorAll(".seat-button:not([disabled])")
      .forEach((button) => {
        button.addEventListener("click", () => {
          selectSeat(Number(button.dataset.seat));
        });
      });
  }

  async function selectSeat(seatNumber) {
    window.ui.hideAlert("tripAlert");

    document.querySelectorAll(".seat-button").forEach((button) => {
      button.disabled = true;
    });

    try {
      const response = await window.api.request("/api/Trip/select-seat", {
        method: "POST",
        auth: true,

        body: JSON.stringify({
          TripId: Number(tripId),

          SeatNumber: Number(seatNumber),
        }),
      });

      const bookingId = window.ui.pick(response, "bookingId", "BookingId");

      const message = window.ui.pick(response, "message", "Message");

      if (!bookingId) {
        throw new Error(message || "The seat could not be selected.");
      }

      window.location.href = `./booking.html?bookingId=${encodeURIComponent(bookingId)}&tripId=${encodeURIComponent(tripId)}&seat=${encodeURIComponent(seatNumber)}`;
    } catch (error) {
      window.ui.showAlert("tripAlert", "error", error.message);

      await loadPage();
    }
  }

  async function loadPage() {
    try {
      const [trip, seats] = await Promise.all([
        window.api.request(`/api/Trip/details/${tripId}`, {
          method: "GET",
          auth: true,
        }),

        window.api.request(`/api/Trip/${tripId}/seats`, {
          method: "GET",
          auth: true,
        }),
      ]);

      renderTrip(trip);
      renderSeats(seats);
    } catch (error) {
      seatLoading.classList.add("hidden");

      window.ui.showAlert("tripAlert", "error", error.message);
    }
  }

  loadPage();
})();
