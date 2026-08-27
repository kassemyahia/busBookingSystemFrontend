(async () => {
  const ready = await window.ui.initProtectedLayout();

  if (!ready) {
    return;
  }

  const bookingId = window.ui.getQuery("bookingId");

  const tripId = window.ui.getQuery("tripId");

  const seat = window.ui.getQuery("seat");

  if (!bookingId || !tripId) {
    window.location.replace("./trips.html");

    return;
  }

  const summary = document.getElementById("bookingSummary");

  const reserveButton = document.getElementById("reserveButton");

  document.getElementById("changeSeatLink").href =
    `./trip-details.html?id=${encodeURIComponent(tripId)}`;

  let tripData = null;

  function renderTrip() {
    const start = window.ui.pick(tripData, "startCity", "StartCity");

    const end = window.ui.pick(tripData, "endCity", "EndCity");

    const departure = window.ui.pick(
      tripData,
      "departureTime",
      "DepartureTime",
    );

    const bus = window.ui.pick(tripData, "busNumber", "BusNumber");

    const type = window.ui.pick(tripData, "busType", "BusType");

    const price = window.ui.pick(tripData, "basePrice", "BasePrice");

    summary.innerHTML = `
            <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

                <div>

                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Booking #${window.ui.escapeHtml(bookingId)}
                    </p>

                    <h2 class="mt-2 text-2xl font-bold">
                        ${window.ui.escapeHtml(start)}
                        <span class="mx-2 text-slate-300">→</span>
                        ${window.ui.escapeHtml(end)}
                    </h2>

                    <p class="mt-2 text-sm text-slate-500">
                        ${window.ui.escapeHtml(departure)}
                    </p>

                </div>

                <div class="rounded-2xl bg-cyan-50 px-6 py-4 text-center">

                    <p class="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                        Seat
                    </p>

                    <p class="mt-1 text-3xl font-bold text-cyan-950">
                        ${window.ui.escapeHtml(seat)}
                    </p>

                </div>

            </div>


            <div class="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">

                <div>
                    <p class="text-xs text-slate-400">
                        Bus
                    </p>

                    <p class="mt-1 font-semibold">
                        ${window.ui.escapeHtml(bus)}
                    </p>
                </div>

                <div>
                    <p class="text-xs text-slate-400">
                        Type
                    </p>

                    <p class="mt-1 font-semibold">
                        ${window.ui.escapeHtml(type)}
                    </p>
                </div>

                <div>
                    <p class="text-xs text-slate-400">
                        Price
                    </p>

                    <p class="mt-1 font-semibold">
                        ${window.ui.escapeHtml(price)}
                    </p>
                </div>

            </div>
        `;
  }

  async function loadBooking() {
    try {
      tripData = await window.api.request(`/api/Trip/details/${tripId}`, {
        method: "GET",
        auth: true,
      });

      renderTrip();
    } catch (error) {
      window.ui.showAlert("bookingAlert", "error", error.message);
    }
  }

  reserveButton.addEventListener(
    "click",

    async () => {
      reserveButton.disabled = true;

      reserveButton.textContent = "Reserving...";

      try {
        const response = await window.api.request(
          `/api/Booking/temporary-booking/${bookingId}`,
          {
            method: "POST",
            auth: true,
          },
        );

        const expiration = window.ui.pick(
          response,
          "expirationTime",
          "ExpirationTime",
        );

        sessionStorage.setItem(
          `booking_${bookingId}`,
          JSON.stringify({
            bookingId,
            tripId,
            seat,
            expiration,
            trip: tripData,
          }),
        );

        window.location.href = `./payment.html?bookingId=${encodeURIComponent(bookingId)}`;
      } catch (error) {
        window.ui.showAlert("bookingAlert", "error", error.message);

        reserveButton.disabled = false;

        reserveButton.textContent = "Reserve seat & continue";
      }
    },
  );

  loadBooking();
})();
(async () => {
  const ready = await window.ui.initProtectedLayout();

  if (!ready) {
    return;
  }

  const bookingId = window.ui.getQuery("bookingId");

  const tripId = window.ui.getQuery("tripId");

  const seat = window.ui.getQuery("seat");

  if (!bookingId || !tripId) {
    window.location.replace("./trips.html");

    return;
  }

  const summary = document.getElementById("bookingSummary");

  const reserveButton = document.getElementById("reserveButton");

  document.getElementById("changeSeatLink").href =
    `./trip-details.html?id=${encodeURIComponent(tripId)}`;

  let tripData = null;

  function renderTrip() {
    const start = window.ui.pick(tripData, "startCity", "StartCity");

    const end = window.ui.pick(tripData, "endCity", "EndCity");

    const departure = window.ui.pick(
      tripData,
      "departureTime",
      "DepartureTime",
    );

    const bus = window.ui.pick(tripData, "busNumber", "BusNumber");

    const type = window.ui.pick(tripData, "busType", "BusType");

    const price = window.ui.pick(tripData, "basePrice", "BasePrice");

    summary.innerHTML = `
            <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

                <div>

                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Booking #${window.ui.escapeHtml(bookingId)}
                    </p>

                    <h2 class="mt-2 text-2xl font-bold">
                        ${window.ui.escapeHtml(start)}
                        <span class="mx-2 text-slate-300">→</span>
                        ${window.ui.escapeHtml(end)}
                    </h2>

                    <p class="mt-2 text-sm text-slate-500">
                        ${window.ui.escapeHtml(departure)}
                    </p>

                </div>

                <div class="rounded-2xl bg-cyan-50 px-6 py-4 text-center">

                    <p class="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                        Seat
                    </p>

                    <p class="mt-1 text-3xl font-bold text-cyan-950">
                        ${window.ui.escapeHtml(seat)}
                    </p>

                </div>

            </div>


            <div class="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">

                <div>
                    <p class="text-xs text-slate-400">
                        Bus
                    </p>

                    <p class="mt-1 font-semibold">
                        ${window.ui.escapeHtml(bus)}
                    </p>
                </div>

                <div>
                    <p class="text-xs text-slate-400">
                        Type
                    </p>

                    <p class="mt-1 font-semibold">
                        ${window.ui.escapeHtml(type)}
                    </p>
                </div>

                <div>
                    <p class="text-xs text-slate-400">
                        Price
                    </p>

                    <p class="mt-1 font-semibold">
                        ${window.ui.escapeHtml(price)}
                    </p>
                </div>

            </div>
        `;
  }

  async function loadBooking() {
    try {
      tripData = await window.api.request(`/api/Trip/details/${tripId}`, {
        method: "GET",
        auth: true,
      });

      renderTrip();
    } catch (error) {
      window.ui.showAlert("bookingAlert", "error", error.message);
    }
  }

  reserveButton.addEventListener(
    "click",

    async () => {
      reserveButton.disabled = true;

      reserveButton.textContent = "Reserving...";

      try {
        const response = await window.api.request(
          `/api/Booking/temporary-booking/${bookingId}`,
          {
            method: "POST",
            auth: true,
          },
        );

        const expiration = window.ui.pick(
          response,
          "expirationTime",
          "ExpirationTime",
        );

        sessionStorage.setItem(
          `booking_${bookingId}`,
          JSON.stringify({
            bookingId,
            tripId,
            seat,
            expiration,
            trip: tripData,
          }),
        );

        window.location.href = `./payment.html?bookingId=${encodeURIComponent(bookingId)}`;
      } catch (error) {
        window.ui.showAlert("bookingAlert", "error", error.message);

        reserveButton.disabled = false;

        reserveButton.textContent = "Reserve seat & continue";
      }
    },
  );

  loadBooking();
})();
