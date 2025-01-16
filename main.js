class ScheduleManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.scheduleData = this.loadScheduleData();
    this.currentMonthBookings = {}; // Initialize empty object
    this.bookingDuration = { hours: 0, minutes: 0, name: "" };
    this.viewOnly = false;
    this.lastBookingId = null; // Track the last booking ID
    this.changingBookingId = null; // Track which booking is being changed

    this.updateCurrentMonthBookings(); // Update before initialization
    this.initializeModal();
    this.initializeCalendar();
    this.attachEventListeners();
  }

  initializeModal() {
    const modal = document.getElementById("bookingModal");
    const confirmBtn = document.getElementById("confirmBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const viewOnlyBtn = document.getElementById("viewOnlyBtn");
    const hoursSelect = document.getElementById("hours");
    const minutesSelect = document.getElementById("minutes");

    hoursSelect.addEventListener("change", () => {
      if (hoursSelect.value === "0") {
        minutesSelect.value = "30";
        minutesSelect.disabled = true;
      } else {
        minutesSelect.disabled = false;
      }
    });

    const nameInput = document.getElementById("bookingName");

    confirmBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("bookingName").value.trim(); // Get trimmed value

      // Only add the name if it's not an empty string
      if (nameInput !== "") {
        this.bookingDuration = {
          hours: parseInt(hoursSelect.value),
          minutes: parseInt(minutesSelect.value),
          name: nameInput, // Use the trimmed name
        };
      } else {
        this.bookingDuration.name = "Unnamed Booking"; // Default name if empty
      }

      this.viewOnly = false;
      modal.style.display = "none";
      this.renderTimeSlots();
    });

    viewOnlyBtn.addEventListener("click", () => {
      this.viewOnly = true;
      modal.style.display = "none";
      this.renderTimeSlots();
    });

    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  handleDateClick(date) {
    this.lastBookingId = null; //reset the last booking id when clicking a date else

    if (this.selectedDate === date) {
      document.getElementById("timeSlots").classList.remove("active");
      this.selectedDate = null;
      return;
    }

    this.selectedDate = date;
    const modal = document.getElementById("bookingModal");
    modal.style.display = "flex";
  }

  updateMonthDisplay() {
    const monthYear = this.currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    document.getElementById("currentMonth").textContent = monthYear;
  }

  initializeCalendar() {
    this.renderCalendarDays();
    this.updateMonthDisplay();
  }

  loadScheduleData() {
    const savedData = localStorage.getItem("scheduleDataTwo");
    return savedData ? JSON.parse(savedData) : {};
  }

  saveScheduleData() {
    localStorage.setItem("scheduleDataTwo", JSON.stringify(this.scheduleData));
  }

  updateCurrentMonthBookings() {
    this.currentMonthBookings = {};

    Object.entries(this.scheduleData).forEach(([bookingId, booking]) => {
      let bookingDate = new Date(booking.startDate);
      let currentHour = booking.startHour;
      let remainingHours = booking.duration.hours;
      let remainingMinutes = booking.duration.minutes;

      // Handle full hours first
      while (remainingHours > 0) {
        const dateKey = this.getDateKey(bookingDate);

        if (!this.currentMonthBookings[dateKey]) {
          this.currentMonthBookings[dateKey] = {};
        }

        if (!this.currentMonthBookings[dateKey][currentHour]) {
          this.currentMonthBookings[dateKey][currentHour] = {
            bookings: [],
            status: "full",
            names: [],
          };
        }

        this.currentMonthBookings[dateKey][currentHour].bookings.push(
          bookingId
        );

        this.currentMonthBookings[dateKey][currentHour].name =
          booking.duration.name || "";

        const timeSlot = this.currentMonthBookings[dateKey][currentHour];
        timeSlot.status =
          timeSlot.bookings.length > 1 ? "multi-selected" : "full";

        currentHour++;
        remainingHours--;

        if (currentHour === 24) {
          bookingDate.setDate(bookingDate.getDate() + 1);
          currentHour = 0;
        }
      }

      if (remainingMinutes > 0) {
        const dateKey = this.getDateKey(bookingDate);

        if (!this.currentMonthBookings[dateKey]) {
          this.currentMonthBookings[dateKey] = {};
        }

        if (!this.currentMonthBookings[dateKey][currentHour]) {
          this.currentMonthBookings[dateKey][currentHour] = {
            bookings: [],
            status: "half",
            name: "",
          };
        }

        this.currentMonthBookings[dateKey][currentHour].bookings.push(
          bookingId
        );
        this.currentMonthBookings[dateKey][currentHour].name =
          booking.duration.name || "";

        const timeSlot = this.currentMonthBookings[dateKey][currentHour];
        timeSlot.status =
          timeSlot.bookings.length > 1 ? "multi-selected" : "half";
      }
    });
  }

  hasBookingsOnDate(dateStr) {
    return (
      this.currentMonthBookings[dateStr] &&
      Object.keys(this.currentMonthBookings[dateStr]).length > 0
    );
  }

  renderCalendarDays() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    days.forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "calendar-day-header";
      dayHeader.textContent = day;
      grid.appendChild(dayHeader);
    });

    const firstDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    );
    const lastDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      0
    );

    for (let i = 0; i < firstDay.getDay(); i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day";
      grid.appendChild(emptyDay);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";

      const dateContainer = document.createElement("div");
      dateContainer.className = "date-number";
      dateContainer.textContent = day;

      const bookingsContainer = document.createElement("div");
      bookingsContainer.className = "bookings-list";

      const currentDay = new Date(
        Date.UTC(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth(),
          day
        )
      );
      const dateKey = this.getDateKey(currentDay);

      // Get unique bookings for this date
      const bookingsForDay = new Set();
      if (this.currentMonthBookings[dateKey]) {
        Object.values(this.currentMonthBookings[dateKey]).forEach((slot) => {
          slot.bookings.forEach((bookingId) => {
            if (this.scheduleData[bookingId]) {
              bookingsForDay.add(this.scheduleData[bookingId].name);
            }
          });
        });
      }

      // Convert Set to Array and handle display logic
      const bookings = Array.from(bookingsForDay);
      if (bookings.length > 0) {
        if (bookings.length <= 2) {
          bookings.forEach((name) => {
            const nameSpan = document.createElement("div");
            nameSpan.className = "booking-name";
            nameSpan.textContent = name;
            bookingsContainer.appendChild(nameSpan);
          });
        } else {
          // Show first two names and count
          for (let i = 0; i < 2; i++) {
            const nameSpan = document.createElement("div");
            nameSpan.className = "booking-name";
            nameSpan.textContent = bookings[i];
            bookingsContainer.appendChild(nameSpan);
          }
          const remainingCount = document.createElement("div");
          remainingCount.className = "remaining-count";
          remainingCount.textContent = `+${bookings.length - 2}`;
          bookingsContainer.appendChild(remainingCount);
        }
      }

      dayElement.appendChild(dateContainer);
      dayElement.appendChild(bookingsContainer);

      dayElement.setAttribute("data-date", dateKey);

      if (currentDay < today) {
        dayElement.classList.add("disabled");
      } else {
        dayElement.addEventListener("click", () =>
          this.handleDateClick(new Date(currentDay))
        );
      }

      if (currentDay.getTime() === today.getTime()) {
        dayElement.classList.add("today");
      }

      const hasOverlap = Object.values(
        this.currentMonthBookings[dateKey] || {}
      ).some((slot) => slot.bookings.length > 1);
      if (this.currentMonthBookings[dateKey]) {
        dayElement.classList.add("has-events");
      }

      grid.appendChild(dayElement);
    }
  }

  getDateKey(date) {
    return date.toISOString().split("T")[0];
  }

  renderTimeSlots() {
    const selectedDateText = document.getElementById("selectedDateText");
    if (selectedDateText) {
      selectedDateText.innerHTML = this.selectedDate.toDateString();
    }

    timeSlotsContainer.classList.add("active");
    const timeSlots = document.getElementById("timeSlots");
    timeSlots.innerHTML = "";

    const dateStr = this.getDateKey(this.selectedDate);
    const dayBookings = this.currentMonthBookings[dateStr] || {};

    // Create 24-hour slots
    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = document.createElement("div");
      timeSlot.className = "time-slot";
      timeSlot.setAttribute("data-hour", hour);

      const timeString = document.createElement("span");
      timeString.className = "time-string";
      timeString.textContent = `${hour.toString().padStart(2, "0")}:00`;

      const booking = dayBookings[hour];
      if (booking) {
        const bookingIds = booking.bookings;
        timeSlot.setAttribute("data-booking-id", bookingIds.join(","));
        timeSlot.classList.add(
          booking.status === "multi-selected"
            ? "multi-selected"
            : booking.status === "half"
            ? "half-selected"
            : "selected"
        );

        const nameSpan = document.createElement("span");
        nameSpan.className = "booking-name-span";

        const bookingName =
          this.scheduleData[bookingIds[0]].duration?.name || "";
        nameSpan.textContent = bookingName;
        timeSlot.appendChild(nameSpan);
      }

      timeSlot.appendChild(timeString);
      timeSlots.appendChild(timeSlot);
    }
  }

  addBooking(startHour) {
    if (
      this.bookingDuration.hours === 0 &&
      this.bookingDuration.minutes === 0
    ) {
      return;
    }

    const dateStr = this.getDateKey(this.selectedDate);
    const bookingId = Date.now().toString();

    this.scheduleData[bookingId] = {
      startDate: dateStr,
      startHour: startHour,
      duration: { ...this.bookingDuration },
      name: this.bookingDuration.name,
    };

    this.saveScheduleData();
    this.updateCurrentMonthBookings();
    this.renderTimeSlots();
    this.renderCalendarDays();

    this.lastBookingId = bookingId;
    this.bookingDuration = { hours: 0, minutes: 0, name: "" };
  }

  // This method not being used in this app
  checkBookingOverlap(startHour, bookingDuration, dayBookings) {
    const newBookingEnd =
      startHour +
      (bookingDuration.hours - 1) +
      Math.ceil(bookingDuration.minutes / 60);

    // Check the current day's bookings
    for (let i = startHour; i <= Math.min(newBookingEnd, 23); i++) {
      if (i in dayBookings) return true;
    }

    // If the booking overflows into the next day
    if (newBookingEnd > 23) {
      const nextDate = new Date(this.selectedDate);
      nextDate.setDate(nextDate.getDate() + 1); // Move to the next day
      const nextDateStr = this.getDateKey(nextDate);
      const nextDayBookings = this.currentMonthBookings[nextDateStr] || {};
      for (let i = 0; i < newBookingEnd - 23; i++) {
        if (i in nextDayBookings) return true;
      }
    }

    return false; // No overlap found
  }

  deleteBooking(bookingId) {
    if (this.scheduleData[bookingId]) {
      delete this.scheduleData[bookingId];
      this.saveScheduleData();
      this.updateCurrentMonthBookings();
      this.renderTimeSlots();
      this.renderCalendarDays();
    }
  }

  showBookingOptions(bookingId, timeSlot) {
    // Close any existing options menu first
    this.closeOptionsMenu();

    const optionsMenu = this.createOptionsMenu(timeSlot);
    optionsMenu.id = "activeOptionsMenu"; // Add an ID to track the active menu
    document.body.appendChild(optionsMenu);
    this.setupDeleteBookingHandler(optionsMenu, bookingId);
    this.setupChangeSlotHandler(optionsMenu, bookingId);
  }

  closeOptionsMenu() {
    const existingMenu = document.getElementById("activeOptionsMenu");
    if (existingMenu) {
      document.body.removeChild(existingMenu);
    }
  }

  setupDeleteBookingHandler(optionsMenu, bookingId) {
    const deleteBookingHandler = () => {
      this.deleteBooking(bookingId);
      document.body.removeChild(optionsMenu); // Remove options menu
    };

    // Attach the event listener for deleting the booking
    document
      .getElementById("deleteBookingBtn")
      .addEventListener("click", deleteBookingHandler);
  }

  setupChangeSlotHandler(optionsMenu, bookingId) {
    document.getElementById("changeSlotBtn").addEventListener("click", () => {
      this.changingBookingId = bookingId; // Set the booking being changed
      document.body.removeChild(optionsMenu);
    });
  }

  createOptionsMenu(timeSlot) {
    const optionsMenu = document.createElement("div");
    optionsMenu.className = "options-menu";

    // Position the options menu based on the clicked time slot
    const rect = timeSlot.getBoundingClientRect();
    optionsMenu.style.position = "absolute";
    optionsMenu.style.top = `${rect.bottom + window.scrollY}px`; // Position below the time slot
    optionsMenu.style.left = `${rect.left + window.scrollX}px`; // Align with the left of the time slot

    optionsMenu.innerHTML = `
      <button id="changeSlotBtn">Change Slot</button>
      <button id="deleteBookingBtn">Delete</button>
    `;

    return optionsMenu;
  }

  changeBookingSlot(bookingId, newStartHour) {
    if (this.scheduleData[bookingId]) {
      const booking = this.scheduleData[bookingId];
      booking.startDate = this.getDateKey(this.selectedDate);
      booking.startHour = newStartHour; // Update the start hour

      this.saveScheduleData();
      this.updateCurrentMonthBookings();
      this.renderTimeSlots();
      this.renderCalendarDays();
    }
  }

  closeTimeSlot() {
    timeSlotsContainer.classList.remove("active");
    this.selectedDate = null;
    this.lastBookingId = null; // Reset lastBookingId when closing the time slot
  }

  attachEventListeners() {
    document.getElementById("prevMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.initializeCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.initializeCalendar();
    });

    document
      .getElementById("closeTimeSlotBtn")
      .addEventListener("click", () => {
        this.closeTimeSlot();
      });

    timeSlotsContainer.addEventListener("click", (e) => {
      const timeSlot = e.target.closest(".time-slot");
      if (!timeSlot) return;

      const bookingIdsAttr = timeSlot.getAttribute("data-booking-id");
      const bookingIds = bookingIdsAttr
        ? bookingIdsAttr.split(",").filter(Boolean)
        : [];
      const hour = parseInt(timeSlot.getAttribute("data-hour"), 10);

      // if the last booking id is the same as the booking id, delete the booking
      if (this.lastBookingId === bookingIds[0]) {
        this.deleteBooking(this.lastBookingId);
        return;
      }
      // Handle change slot operation
      if (this.changingBookingId && bookingIds.length === 0) {
        this.changeBookingSlot(this.changingBookingId, hour);
        this.changingBookingId = null; // Reset after changing
        return;
      }

      // Handle normal booking operations
      if (this.lastBookingId && bookingIds.length === 0) {
        if (!isNaN(hour)) {
          this.changeBookingSlot(this.lastBookingId, hour);
        }
      } else if (bookingIds.length >= 1) {
        this.showBookingOptions(bookingIds[0], timeSlot);
      } else {
        if (!isNaN(hour)) {
          this.addBooking(hour);
        } else {
          console.error("Invalid hour attribute on time slot.");
        }
      }
    });

    // when clicking outside the options menu, close it
    document.addEventListener("click", (e) => {
      const optionsMenu = document.getElementById("activeOptionsMenu");
      const timeSlot = e.target.closest(".time-slot");
      if (optionsMenu && !optionsMenu.contains(e.target) && !timeSlot) {
        this.closeOptionsMenu();
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new ScheduleManager();
});
