class ScheduleManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.scheduleData = this.loadScheduleData();
    this.currentMonthBookings = {}; // Initialize empty object
    this.bookingDuration = { hours: 0, minutes: 0 };
    this.viewOnly = false;

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

    // Filter bookings for the current month and transform into date-hour format
    Object.entries(this.scheduleData).forEach(([bookingId, booking]) => {
      let bookingDate = new Date(booking.startDate);
      let currentHour = booking.startHour;
      let remainingHours = booking.duration.hours;
      let remainingMinutes = booking.duration.minutes;

      while (remainingHours > 0 || remainingMinutes > 0) {
        const dateKey = this.getDateKey(bookingDate);

        if (!this.currentMonthBookings[dateKey]) {
          this.currentMonthBookings[dateKey] = {};
        }

        // Add full hours
        while (currentHour < 24 && remainingHours > 0) {
          this.currentMonthBookings[dateKey][currentHour] = {
            status: "full",
            bookingId: bookingId,
          };
          currentHour++;
          remainingHours--;
        }

        // Handle the case where remaining minutes don't fit in the current day
        if (
          currentHour === 24 ||
          (remainingHours === 0 && remainingMinutes > 0)
        ) {
          if (currentHour === 24) {
            bookingDate.setDate(bookingDate.getDate() + 1);
            currentHour = 0;
          } else {
            // Add remaining minutes as "half" hour booking
            this.currentMonthBookings[dateKey][currentHour] = {
              status: "half",
              bookingId: bookingId,
            };
            remainingMinutes = 0;
          }
          continue;
        }
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

    // Add day headers
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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day";
      grid.appendChild(emptyDay);
    }

    // Add days of the month
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Ensure today is set to midnight UTC

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";
      dayElement.textContent = day;

      // Create the current day in UTC
      const currentDay = new Date(
        Date.UTC(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth(),
          day
        )
      );

      const dateKey = this.getDateKey(currentDay);
      dayElement.setAttribute("data-date", dateKey);

      // Check if day is in the past
      if (currentDay < today) {
        dayElement.classList.add("disabled");
      } else {
        dayElement.addEventListener("click", () =>
          this.handleDateClick(new Date(currentDay))
        );
      }

      // Highlight today
      if (currentDay.getTime() === today.getTime()) {
        dayElement.classList.add("today");
      }

      // Check for bookings using currentMonthBookings
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
        timeSlot.setAttribute("data-booking-id", booking.bookingId);
        timeSlot.classList.add(
          booking.status === "half" ? "half-selected" : "selected"
        );
      }

      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      timeSlot.textContent = timeString;
      timeSlots.appendChild(timeSlot);
    }
  }

  addBooking(startHour) {
    // Check if booking duration is 0 hours and 0 minutes
    if (
      this.bookingDuration.hours === 0 &&
      this.bookingDuration.minutes === 0
    ) {
      return;
    }

    const dateStr = this.getDateKey(this.selectedDate);
    const dayBookings = this.currentMonthBookings[dateStr] || {};

    // Calculate the end time of the new booking
    const newBookingEnd =
      startHour +
      (this.bookingDuration.hours - 1) +
      this.bookingDuration.minutes / 60;

    console.log("New booking start:", startHour, "end:", newBookingEnd);

    const isOverlapping = this.checkBookingOverlap(
      startHour,
      this.bookingDuration,
      dayBookings
    );

    if (isOverlapping) {
      alert(
        "Cannot add the meeting here. It collides with an existing booking"
      );
      return;
    }

    const bookingId = Date.now().toString();

    this.scheduleData[bookingId] = {
      startDate: this.getDateKey(this.selectedDate),
      startHour: startHour,
      duration: { ...this.bookingDuration },
    };

    this.saveScheduleData();
    this.updateCurrentMonthBookings();
    this.renderTimeSlots();
    this.renderCalendarDays();

    this.bookingDuration = { hours: 0, minutes: 0 };
  }

  addBooking(startHour) {
    if (
      this.bookingDuration.hours === 0 &&
      this.bookingDuration.minutes === 0
    ) {
      return;
    }

    const dateStr = this.getDateKey(this.selectedDate);
    const dayBookings = this.currentMonthBookings[dateStr] || {};

    // Calculate the end time of the new booking
    const newBookingEnd =
      startHour +
      (this.bookingDuration.hours - 1) +
      Math.ceil(this.bookingDuration.minutes / 60);

    console.log("New booking start:", startHour, "end:", newBookingEnd);

    const isOverlapping = this.checkBookingOverlap(
      startHour,
      this.bookingDuration,
      dayBookings
    );

    if (isOverlapping) {
      alert(
        "Cannot add the meeting here. It collides with an existing booking."
      );
      return;
    }

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

    this.bookingDuration = { hours: 0, minutes: 0 };
  }

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
      for (let i = 0; i <= newBookingEnd - 24; i++) {
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
    const optionsMenu = this.createOptionsMenu(timeSlot);
    document.body.appendChild(optionsMenu);
    this.setupDeleteBookingHandler(optionsMenu, bookingId);
    this.setupChangeSlotHandler(optionsMenu, bookingId);
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
        const bookingId = timeSlot.getAttribute("data-booking-id");
        if (bookingId) {
          this.showBookingOptions(bookingId, timeSlot);
        } else {
          const hour = parseInt(timeSlot.getAttribute("data-hour"), 10);
          this.addBooking(hour);
        }
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new ScheduleManager();
});
