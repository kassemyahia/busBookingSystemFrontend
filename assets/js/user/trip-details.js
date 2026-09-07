(async () => {
  if (!(await window.ui.initProtectedLayout())) return;

  const tripId = window.ui.getQuery("id");
  if (!tripId) {
    window.location.replace("./trips.html");
    return;
  }

  const summary = document.getElementById("tripSummary");
  const seatsGrid = document.getElementById("seatsGrid");
  const seatLoading = document.getElementById("seatLoading");
  const footer = document.getElementById("seatSelectionFooter");
  const temporaryButton = document.getElementById("temporaryBookingButton");
  const paymentButton = document.getElementById("continueToPayment");
  const temporaryStatus = document.getElementById("temporaryBookingStatus");
  let selectedSeat = null;
  let bookingId = null;
  let tripData = null;
  let requestInProgress = false;

  function isAvailable(status) {
    return Number(status) === 1 || String(status).toLowerCase() === "available";
  }

  function seatStyle(status) {
    const number = Number(status);
    const text = String(status).toLowerCase();
    if (number === 1 || text === "available") {
      return "border-cyan-200 bg-teal-50 text-cyan-800 hover:border-teal-500 hover:bg-teal-50 cursor-pointer";
    }
    if (number === 2 || text === "reserved") {
      return "border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed";
    }
    return "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed";
  }

  function parseNumber(value) {
    const match = String(value ?? "")
      .replaceAll(",", "")
      .match(/-?\d+(?:\.\d+)?/);
    const number = match ? Number(match[0]) : NaN;
    return Number.isFinite(number) ? number : null;
  }

  function formatSyp(value, fallback) {
    if (value === null) return String(fallback || "—");
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} SYP`;
  }

  function renderTrip(trip) {
    const start = window.ui.pick(trip, "startCity", "StartCity");
    const end = window.ui.pick(trip, "endCity", "EndCity");
    const departure = window.ui.pick(trip, "departureTime", "DepartureTime");
    const busNumber = window.ui.pick(trip, "busNumber", "BusNumber");
    const busType = window.ui.pick(trip, "busType", "BusType");
    const seats = window.ui.pick(trip, "availableSeats", "AvailableSeats");
    const basePrice = window.ui.pick(trip, "basePrice", "BasePrice");
    const driver = window.ui.pick(trip, "driverName", "DriverName");
    const status = window.ui.pick(trip, "tripStatus", "TripStatus");
    const discountName = window.ui.pick(trip, "discountName", "DiscountName");
    const rawPercentage = window.ui.pick(
      trip,
      "discountPercentage",
      "DiscountPercentage",
    );
    const parsedBasePrice = parseNumber(basePrice);
    const parsedPercentage = parseNumber(rawPercentage);
    const hasDiscount =
      parsedPercentage !== null &&
      parsedPercentage > 0 &&
      String(discountName || "").toLowerCase() !== "no discount";
    const percentage = hasDiscount
      ? Math.min(Math.max(parsedPercentage, 0), 100)
      : 0;
    const finalPrice =
      parsedBasePrice === null
        ? null
        : parsedBasePrice * (1 - percentage / 100);
    const basePriceLabel = formatSyp(parsedBasePrice, basePrice);
    const finalPriceLabel = formatSyp(finalPrice, basePriceLabel);
    const discountLabel = hasDiscount
      ? `${discountName || "Discount"} · ${percentage.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`
      : "No discount · 0%";

    summary.innerHTML = `
      <div class="overflow-hidden rounded-3xl bg-slate-950 text-white">
        <div class="p-7 sm:p-9">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="mb-3 flex flex-wrap gap-2">
                <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-200">${window.ui.escapeHtml(busType)}</span>
                <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">${window.ui.escapeHtml(status)}</span>
              </div>
              <h1 class="text-3xl font-bold sm:text-4xl">${window.ui.escapeHtml(start)}<span class="mx-2 text-slate-500">→</span>${window.ui.escapeHtml(end)}</h1>
              <p class="mt-3 text-slate-400">${window.ui.escapeHtml(departure)}</p>
            </div>
            <div class="min-w-64 rounded-2xl bg-white/5 p-5 lg:text-right">
              <div class="flex justify-between gap-5 text-sm lg:justify-end"><span class="text-slate-400">Base price</span><span class="font-semibold">${window.ui.escapeHtml(basePriceLabel)}</span></div>
              <div class="mt-2 flex justify-between gap-5 text-sm lg:justify-end"><span class="text-slate-400">Discount</span><span class="font-semibold text-emerald-300">${window.ui.escapeHtml(discountLabel)}</span></div>
              <p class="mt-4 text-sm font-semibold text-teal-200">Price after discount</p>
              <p class="mt-1 text-3xl font-extrabold">${window.ui.escapeHtml(finalPriceLabel)}</p>
            </div>
          </div>
          <div class="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div><p class="text-xs text-slate-500">Bus</p><p class="mt-1 font-semibold">${window.ui.escapeHtml(busNumber)}</p></div>
            <div><p class="text-xs text-slate-500">Driver</p><p class="mt-1 font-semibold">${window.ui.escapeHtml(driver)}</p></div>
            <div><p class="text-xs text-slate-500">Available seats</p><p class="mt-1 font-semibold">${window.ui.escapeHtml(seats)}</p></div>
          </div>
        </div>
      </div>`;
  }

  function renderSeats(seats) {
    seatLoading.classList.add("hidden");
    if (!Array.isArray(seats) || seats.length === 0) {
      seatsGrid.innerHTML = '<p class="col-span-full py-10 text-center text-sm text-slate-400">No seat information available.</p>';
      return;
    }

    seatsGrid.innerHTML = seats
      .map((seat) => {
        const number = window.ui.pick(seat, "seatNumber", "SeatNumber");
        const status = window.ui.pick(seat, "status", "Status");
        return `<button type="button" data-seat="${window.ui.escapeHtml(number)}" ${isAvailable(status) ? "" : "disabled"} class="seat-button rounded-xl border px-3 py-4 text-sm font-bold transition ${seatStyle(status)}">${window.ui.escapeHtml(number)}</button>`;
      })
      .join("");

    document.querySelectorAll(".seat-button:not([disabled])").forEach((button) => {
      button.addEventListener("click", () => {
        if (requestInProgress || bookingId) return;
        selectedSeat = Number(button.dataset.seat);
        document.querySelectorAll(".seat-button:not([disabled])").forEach((seat) => {
          seat.classList.remove("!border-teal-600", "!bg-teal-600", "!text-white", "shadow-md");
        });
        button.classList.add("!border-teal-600", "!bg-teal-600", "!text-white", "shadow-md");
        document.getElementById("selectedSeatLabel").textContent = `Seat ${selectedSeat}`;
        footer.classList.remove("hidden");
        footer.classList.add("grid");
      });
    });
  }

  function setActionsLoading(loading, activeButton) {
    requestInProgress = loading;
    temporaryButton.disabled = loading || Boolean(temporaryStatus.dataset.complete);
    paymentButton.disabled = loading;
    temporaryButton.textContent =
      loading && activeButton === temporaryButton
        ? "Temporarily booking..."
        : temporaryStatus.dataset.complete
          ? "Seat held for 2 hours"
          : "Temporarily book for 2 hours";
    paymentButton.textContent =
      loading && activeButton === paymentButton
        ? "Creating booking..."
        : "Continue to payment";
  }

  async function ensureBooking() {
    if (bookingId) return bookingId;
    const response = await window.api.request("/api/Trip/select-seat", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        TripId: Number(tripId),
        SeatNumber: Number(selectedSeat),
      }),
    });
    const id = window.ui.pick(response, "bookingId", "BookingId");
    const message = window.ui.pick(response, "message", "Message");
    if (!id) throw new Error(message || "The booking could not be created.");
    bookingId = id;
    document.querySelectorAll(".seat-button").forEach((button) => {
      button.disabled = true;
    });
    return bookingId;
  }

  function cacheBooking(expiration = null) {
    sessionStorage.setItem(
      `booking_${bookingId}`,
      JSON.stringify({ bookingId, tripId, seat: selectedSeat, expiration, trip: tripData }),
    );
  }

  function goToPayment() {
    window.location.href = `./payment.html?bookingId=${encodeURIComponent(bookingId)}`;
  }

  paymentButton.addEventListener("click", async () => {
    if (!selectedSeat || requestInProgress) return;
    window.ui.hideAlert("tripAlert");
    setActionsLoading(true, paymentButton);
    try {
      await ensureBooking();
      cacheBooking();
      goToPayment();
    } catch (error) {
      window.ui.showAlert("tripAlert", "error", error.message);
      if (!bookingId) await loadPage(true);
      setActionsLoading(false);
    }
  });

  temporaryButton.addEventListener("click", async () => {
    if (!selectedSeat || requestInProgress || temporaryStatus.dataset.complete) return;
    window.ui.hideAlert("tripAlert");
    setActionsLoading(true, temporaryButton);
    try {
      await ensureBooking();
      const response = await window.api.request(
        `/api/Booking/temporary-booking/${encodeURIComponent(bookingId)}`,
        { method: "POST", auth: true },
      );
      const expiration = window.ui.pick(response, "expirationTime", "ExpirationTime");
      cacheBooking(expiration);
      temporaryStatus.dataset.complete = "true";
      temporaryStatus.textContent = expiration
        ? `Seat reserved for 2 hours. Hold expires ${window.ui.formatDate(expiration)}.`
        : "Seat reserved for 2 hours. You can continue to payment when ready.";
      temporaryStatus.classList.remove("hidden");
      window.ui.showAlert("tripAlert", "success", "Your seat is temporarily reserved for 2 hours.");
    } catch (error) {
      window.ui.showAlert("tripAlert", "error", error.message);
    } finally {
      setActionsLoading(false);
    }
  });

  async function loadPage(resetSelection = false) {
    if (resetSelection) {
      selectedSeat = null;
      footer.classList.add("hidden");
      footer.classList.remove("grid");
    }
    try {
      const [trip, seats] = await Promise.all([
        window.api.request(`/api/Trip/details/${tripId}`, { method: "GET", auth: true }),
        window.api.request(`/api/Trip/${tripId}/seats`, { method: "GET", auth: true }),
      ]);
      tripData = trip;
      renderTrip(trip);
      renderSeats(seats);
    } catch (error) {
      seatLoading.classList.add("hidden");
      window.ui.showAlert("tripAlert", "error", error.message);
    }
  }

  loadPage();
})();
