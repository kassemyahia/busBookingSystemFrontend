(async () => {
  const ready = await window.ui.initProtectedLayout();

  if (!ready) {
    return;
  }

  const ticketsGrid = document.getElementById("ticketsGrid");

  const discountGrid = document.getElementById("discountGrid");

  const loading = document.getElementById("ticketsLoading");

  function bookingStatusName(status) {
    const number = Number(status);

    const names = {
      1: "Created",
      2: "Pending payment",
      3: "Confirmed",
      4: "Cancelled",
      5: "Expired",
    };

    if (Number.isFinite(number) && names[number]) {
      return names[number];
    }

    return String(status || "").replace("PendingPayment", "Pending payment");
  }

  function isPending(status) {
    return (
      Number(status) === 2 ||
      String(status).toLowerCase() === "pendingpayment" ||
      String(status).toLowerCase() === "pending payment"
    );
  }

  function isConfirmed(status) {
    return Number(status) === 3 || String(status).toLowerCase() === "confirmed";
  }

  function statusClass(status) {
    if (isConfirmed(status)) {
      return "bg-emerald-50 text-emerald-700";
    }

    if (isPending(status)) {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-slate-100 text-slate-600";
  }

  function renderTickets(tickets) {
    loading.classList.add("hidden");

    if (!Array.isArray(tickets) || tickets.length === 0) {
      ticketsGrid.innerHTML = `
                <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center lg:col-span-2">

                    <p class="text-lg font-semibold">
                        No tickets yet
                    </p>

                    <p class="mt-2 text-sm text-slate-400">
                        Your bookings will appear here.
                    </p>

                    <a
                        href="./trips.html"
                        class="mt-6 inline-block rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                    >
                        Find a trip
                    </a>

                </div>
            `;

      return;
    }

    ticketsGrid.innerHTML = tickets
      .map((ticket) => {
        const bookingId = window.ui.pick(ticket, "bookingId", "BookingId");

        const tripId = window.ui.pick(ticket, "tripId", "TripId");

        const start = window.ui.pick(ticket, "startCity", "StartCity");

        const end = window.ui.pick(ticket, "endCity", "EndCity");

        const tripDate = window.ui.pick(ticket, "tripDate", "TripDate");

        const busType = window.ui.pick(ticket, "busType", "BusType");

        const busNumber = window.ui.pick(ticket, "busNumber", "BusNumber");

        const seat = window.ui.pick(ticket, "seatNumber", "SeatNumber");

        const status = window.ui.pick(ticket, "status", "Status");

        const expiration = window.ui.pick(
          ticket,
          "expirationTime",
          "ExpirationTime",
        );

        const price = window.ui.pick(ticket, "finalPrice", "FinalPrice");

        return `
                    <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div class="p-6">

                            <div class="flex items-start justify-between gap-4">

                                <div>

                                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Booking #${window.ui.escapeHtml(bookingId)}
                                    </p>

                                    <h2 class="mt-2 text-xl font-bold">
                                        ${window.ui.escapeHtml(start)}
                                        <span class="mx-1 text-slate-300">→</span>
                                        ${window.ui.escapeHtml(end)}
                                    </h2>

                                    <p class="mt-2 text-sm text-slate-500">
                                        ${window.ui.escapeHtml(tripDate)}
                                    </p>

                                </div>

                                <span
                                    class="rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}"
                                >
                                    ${window.ui.escapeHtml(bookingStatusName(status))}
                                </span>

                            </div>


                            <div class="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">

                                <div>

                                    <p class="text-xs text-slate-400">
                                        Seat
                                    </p>

                                    <p class="mt-1 font-bold">
                                        ${window.ui.escapeHtml(seat)}
                                    </p>

                                </div>


                                <div>

                                    <p class="text-xs text-slate-400">
                                        Bus
                                    </p>

                                    <p class="mt-1 font-semibold">
                                        ${window.ui.escapeHtml(busNumber)}
                                    </p>

                                </div>


                                <div>

                                    <p class="text-xs text-slate-400">
                                        Type
                                    </p>

                                    <p class="mt-1 font-semibold">
                                        ${window.ui.escapeHtml(busType)}
                                    </p>

                                </div>


                                <div>

                                    <p class="text-xs text-slate-400">
                                        Price
                                    </p>

                                    <p class="mt-1 font-bold">
                                        ${window.ui.escapeHtml(price)}
                                    </p>

                                </div>

                            </div>


                            ${
                              isPending(status) && expiration
                                ? `
                                    <div class="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                        Payment reservation expires:
                                        <strong>
                                            ${window.ui.escapeHtml(window.ui.formatDate(expiration))}
                                        </strong>
                                    </div>
                                `
                                : ""
                            }


                            <div class="mt-6 flex flex-wrap gap-3">

                                ${
                                  isPending(status)
                                    ? `
                                        <a
                                            href="./payment.html?bookingId=${encodeURIComponent(bookingId)}"
                                            class="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                        >
                                            Pay now
                                        </a>
                                    `
                                    : ""
                                }


                                ${
                                  isPending(status) || isConfirmed(status)
                                    ? `
                                        <button
                                            type="button"
                                            data-cancel-booking="${window.ui.escapeHtml(bookingId)}"
                                            class="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                                        >
                                            Cancel booking
                                        </button>
                                    `
                                    : ""
                                }


                                <a
                                    href="./trip-details.html?id=${encodeURIComponent(tripId)}"
                                    class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Trip details
                                </a>

                            </div>

                        </div>

                    </article>
                `;
      })
      .join("");

    document.querySelectorAll("[data-cancel-booking]").forEach((button) => {
      button.addEventListener("click", () => {
        cancelBooking(button.dataset.cancelBooking);
      });
    });
  }

  function renderDiscounts(discounts) {
    if (!Array.isArray(discounts) || discounts.length === 0) {
      discountGrid.innerHTML = `
                <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center lg:col-span-2">

                    <p class="font-semibold">
                        No discount tickets
                    </p>

                    <p class="mt-2 text-sm text-slate-400">
                        Any available discount tickets will appear here.
                    </p>

                </div>
            `;

      return;
    }

    discountGrid.innerHTML = discounts
      .map((item) => {
        const number = window.ui.pick(
          item,
          "discountTicketNumber",
          "DiscountTicketNumber",
        );

        const name = window.ui.pick(item, "discountName", "DiscountName");

        const percentage = window.ui.pick(item, "percentage", "Percentage");

        const start = window.ui.pick(item, "startDate", "StartDate");

        const end = window.ui.pick(item, "endDate", "EndDate");

        return `
                    <article class="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50 p-6">

                        <p class="text-xs font-semibold uppercase tracking-wider text-cyan-600">
                            Discount #${window.ui.escapeHtml(number)}
                        </p>

                        <div class="mt-3 flex items-start justify-between gap-4">

                            <h2 class="text-xl font-bold">
                                ${window.ui.escapeHtml(name)}
                            </h2>

                            <span class="rounded-full bg-cyan-700 px-3 py-1 text-sm font-bold text-white">
                                ${window.ui.escapeHtml(percentage)}
                            </span>

                        </div>

                        <div class="mt-6 text-sm text-slate-500">

                            <p>
                                Valid from:
                                <span class="font-medium text-slate-700">
                                    ${window.ui.escapeHtml(window.ui.formatDate(start))}
                                </span>
                            </p>

                            <p class="mt-2">
                                Valid until:
                                <span class="font-medium text-slate-700">
                                    ${window.ui.escapeHtml(window.ui.formatDate(end))}
                                </span>
                            </p>

                        </div>

                    </article>
                `;
      })
      .join("");
  }

  async function cancelBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await window.api.request(
        `/api/Booking/cancel-booking/${bookingId}`,
        {
          method: "POST",
          auth: true,
        },
      );

      window.ui.showAlert(
        "ticketsAlert",
        "success",
        window.ui.pick(response, "message", "Message") || "Booking cancelled.",
      );

      await loadTickets();
    } catch (error) {
      window.ui.showAlert("ticketsAlert", "error", error.message);
    }
  }

  async function loadTickets() {
    loading.classList.remove("hidden");

    try {
      const [tickets, discounts] = await Promise.all([
        window.api.request("/api/UserTickets/my-tickets", {
          method: "GET",
          auth: true,
        }),

        window.api.request("/api/UserTickets/my-discount-tickets", {
          method: "GET",
          auth: true,
        }),
      ]);

      renderTickets(Array.isArray(tickets) ? tickets : []);

      renderDiscounts(Array.isArray(discounts) ? discounts : []);
    } catch (error) {
      loading.classList.add("hidden");

      window.ui.showAlert("ticketsAlert", "error", error.message);
    }
  }

  const normalTab = document.getElementById("normalTicketsTab");

  const discountTab = document.getElementById("discountTicketsTab");

  const normalSection = document.getElementById("normalTicketsSection");

  const discountSection = document.getElementById("discountTicketsSection");

  normalTab.addEventListener("click", () => {
    normalSection.classList.remove("hidden");

    discountSection.classList.add("hidden");

    normalTab.className =
      "rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white";

    discountTab.className =
      "rounded-lg px-4 py-2 text-sm font-semibold text-slate-500";
  });

  discountTab.addEventListener("click", () => {
    normalSection.classList.add("hidden");

    discountSection.classList.remove("hidden");

    discountTab.className =
      "rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white";

    normalTab.className =
      "rounded-lg px-4 py-2 text-sm font-semibold text-slate-500";
  });

  loadTickets();
})();
