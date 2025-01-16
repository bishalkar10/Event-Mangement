class ScheduleManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.scheduleData = this.loadScheduleData();
    this.currentMonthBookings = {}; // Initialize empty object
    this.bookingDuration = { hours: 0, minutes: 0 };
    this.viewOnly = false;
    this.lastBookingId = null; // Track the last booking ID

    this.updateCurrentMonthBookings(); // Update before initialization
    this.initializeModal();
    this.initializeCalendar();
    this.attachEventListeners();
    console.log(this.currentMonthBookings);
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

    confirmBtn.addEventListener("click", () => {
      this.bookingDuration = {
        hours: parseInt(hoursSelect.value),
        minutes: parseInt(minutesSelect.value),
      };
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
          };
        }

        this.currentMonthBookings[dateKey][currentHour].bookings.push(
          bookingId
        );

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
          };
        }

        this.currentMonthBookings[dateKey][currentHour].bookings.push(
          bookingId
        );

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
      dayElement.textContent = day;

      const currentDay = new Date(
        Date.UTC(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth(),
          day
        )
      );
      const dateKey = this.getDateKey(currentDay);
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

      const booking = dayBookings[hour];
      if (booking) {
        const bookingIds = booking.bookings.join(",");
        timeSlot.setAttribute("data-booking-id", bookingIds);
        timeSlot.classList.add(
          booking.status === "multi-selected"
            ? "multi-selected"
            : booking.status === "half"
            ? "half-selected"
            : "selected"
        );
      }

      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      timeSlot.textContent = timeString;
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
    };

    this.saveScheduleData();
    this.updateCurrentMonthBookings();
    this.renderTimeSlots();
    this.renderCalendarDays();

    this.lastBookingId = bookingId; // Store the last booking ID
    this.bookingDuration = { hours: 0, minutes: 0 };
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
      console.log(nextDayBookings);
      for (let i = 0; i < newBookingEnd - 23; i++) {
        console.log(i);
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
    optionsMenu.id = 'activeOptionsMenu'; // Add an ID to track the active menu
    document.body.appendChild(optionsMenu);
    this.setupDeleteBookingHandler(optionsMenu, bookingId);
    this.setupChangeSlotHandler(optionsMenu, bookingId);
  }

  closeOptionsMenu() {
    const existingMenu = document.getElementById('activeOptionsMenu');
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
    const changeSlotHandler = (e) => {
      const newTimeSlot = e.target.closest(".time-slot");
      if (newTimeSlot) {
        const newStartHour = parseInt(
          newTimeSlot.getAttribute("data-hour"),
          10
        );
        this.changeBookingSlot(bookingId, newStartHour);
        document.body.removeChild(optionsMenu); // Remove options menu
        timeSlotsContainer.removeEventListener("click", changeSlotHandler); // Clean up the event listener
      }
    };

    // Attach the event listener for changing the slot
    document.getElementById("changeSlotBtn").addEventListener("click", () => {
      timeSlotsContainer.addEventListener("click", changeSlotHandler);
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
      if (timeSlot) {
        const bookingIdsAttr = timeSlot.getAttribute("data-booking-id");
        const bookingIds = bookingIdsAttr
          ? bookingIdsAttr.split(",").filter(Boolean)
          : [];

        if (this.lastBookingId && bookingIds.length === 0) {
          // If there's a last booking and no existing booking in the slot
          const hour = parseInt(timeSlot.getAttribute("data-hour"), 10);
          if (!isNaN(hour)) {
            this.changeBookingSlot(this.lastBookingId, hour); // Change the slot for the last booking
          }
        } else if (bookingIds.length > 1) {
          alert(`Multiple bookings: ${bookingIds.join(", ")}`);
        } else if (bookingIds.length === 1) {
          this.showBookingOptions(bookingIds[0], timeSlot);
        } else {
          const hour = parseInt(timeSlot.getAttribute("data-hour"), 10);
          if (!isNaN(hour)) {
            this.addBooking(hour);
          } else {
            console.error("Invalid hour attribute on time slot.");
          }
        }
      }
    });

    // Add click event listener to close menu when clicking outside
    document.addEventListener('click', (e) => {
      const optionsMenu = document.getElementById('activeOptionsMenu');
      const timeSlot = e.target.closest('.time-slot');
      if (optionsMenu && !optionsMenu.contains(e.target) && !timeSlot) {
        this.closeOptionsMenu();
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new ScheduleManager();
});
