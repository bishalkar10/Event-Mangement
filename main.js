const timeSlotsContainer = document.getElementById("timeSlotsContainer");

class ScheduleManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.scheduleData = this.loadScheduleData();
    this.bookingDuration = { hours: 0, minutes: 0 };
    this.viewOnly = false;
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

  initializeCalendar() {
    this.renderCalendarDays();
    this.updateMonthDisplay();
  }

  loadScheduleData() {
    const savedData = localStorage.getItem("scheduleData");
    return savedData ? JSON.parse(savedData) : {};
  }

  saveScheduleData() {
    localStorage.setItem("scheduleData", JSON.stringify(this.scheduleData));
  }

  updateMonthDisplay() {
    const monthYear = this.currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    document.getElementById("currentMonth").textContent = monthYear;
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
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";
      dayElement.textContent = day;

      const currentDay = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        day
      );

      const dateKey = this.getDateKey(currentDay);
      dayElement.setAttribute("data-date", dateKey);

      // Check if day is in the past
      if (currentDay < new Date().setHours(0, 0, 0, 0)) {
        dayElement.classList.add("disabled");
      } else {
        dayElement.addEventListener("click", () =>
          this.handleDateClick(currentDay)
        );
      }

      // Highlight today
      if (currentDay.toDateString() === today.toDateString()) {
        dayElement.classList.add("today");
      }

      // Mark days with events
      if (this.scheduleData[dateKey]?.length > 0) {
        dayElement.classList.add("has-events");
      }

      grid.appendChild(dayElement);
    }
  }

  // this is used to store selected timeslots in localstorage via keypair value
  getDateKey(date) {
    return date.toISOString().split("T")[0];
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

  updateCalendarDay(dateKey) {
    const dayElement = document.querySelector(`[data-date='${dateKey}']`);

    if (dayElement) {
      if (this.scheduleData[dateKey]?.length > 0) {
        dayElement.classList.add("has-events");
      } else {
        dayElement.classList.remove("has-events");
      }
    }
  }

  renderTimeSlots() {
    const selectedDateText = document.getElementById("selectedDateText");
    if (selectedDateText) {
      const formattedDate = new Date(this.selectedDate).toDateString(); // Format the date
      selectedDateText.innerHTML = formattedDate;
    }

    timeSlotsContainer.classList.add("active");
    const timeSlots = document.getElementById("timeSlots");
    timeSlots.innerHTML = "";

    const dateKey = this.getDateKey(this.selectedDate);
    const selectedSlots = this.scheduleData[dateKey] || [];

    // Create 24-hour slots
    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = document.createElement("div");
      timeSlot.className = "time-slot";
      timeSlot.setAttribute("data-hour", hour);

      // Check for full and half selections
      if (selectedSlots.includes(`${hour}-full`)) {
        timeSlot.classList.add("selected");
      } else if (selectedSlots.includes(`${hour}-half`)) {
        timeSlot.classList.add("half-selected");
      }

      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      timeSlot.textContent = timeString;

      timeSlot.addEventListener("click", (e) => {
        if (this.viewOnly) {
          this.deleteBooking(hour, e.target);
        } else {
          this.addBooking(hour);
        }
      });
      timeSlots.appendChild(timeSlot);
    }
  }

  deleteBooking(hour, clickedElement) {
    const dateKey = this.getDateKey(this.selectedDate);

    if (this.scheduleData[dateKey]) {
      const regex = new RegExp(`^${hour}-(full|half)$`);
      const index = this.scheduleData[dateKey].findIndex((slot) =>
        regex.test(slot)
      );

      if (index !== -1) {
        this.scheduleData[dateKey].splice(index, 1);

        if (clickedElement) {
          clickedElement.className = "time-slot";
        }

        if (this.scheduleData[dateKey].length === 0) {
          delete this.scheduleData[dateKey];
        }

        this.saveScheduleData();
        this.updateCalendarDay(dateKey);
      }
    }
  }

  addBooking(hour) {
    const dateKey = this.getDateKey(this.selectedDate);

    if (!this.scheduleData[dateKey]) {
      this.scheduleData[dateKey] = [];
    }

    const fullHours = this.bookingDuration.hours;
    const extraMinutes = this.bookingDuration.minutes;

    let nextDayKey = null; // To handle overflow into the next day

    // Add the current hour and consecutive full hours to the schedule
    for (let i = 0; i < fullHours; i++) {
      const currentHour = hour + i;

      if (currentHour < 24) {
        if (!this.scheduleData[dateKey].includes(`${currentHour}-full`)) {
          this.scheduleData[dateKey].push(`${currentHour}-full`);
        }
      } else {
        // Handle overflow to the next day
        if (!nextDayKey) {
          const nextDay = new Date(this.selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDayKey = this.getDateKey(nextDay);
          if (!this.scheduleData[nextDayKey]) {
            this.scheduleData[nextDayKey] = [];
          }
        }
        const overflowHour = currentHour - 24;
        if (!this.scheduleData[nextDayKey].includes(`${overflowHour}-full`)) {
          this.scheduleData[nextDayKey].push(`${overflowHour}-full`);
        }
      }
    }

    // Handle the extra 30 minutes
    if (extraMinutes === 30) {
      const lastHour = hour + fullHours;

      if (lastHour < 24) {
        if (!this.scheduleData[dateKey].includes(`${lastHour}-half`)) {
          this.scheduleData[dateKey].push(`${lastHour}-half`);
        }
      } else {
        if (!nextDayKey) {
          const nextDay = new Date(this.selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDayKey = this.getDateKey(nextDay);
          if (!this.scheduleData[nextDayKey]) {
            this.scheduleData[nextDayKey] = [];
          }
        }
        const overflowHour = lastHour - 24;
        if (!this.scheduleData[nextDayKey].includes(`${overflowHour}-half`)) {
          this.scheduleData[nextDayKey].push(`${overflowHour}-half`);
        }
      }
    }

    this.saveScheduleData();
    this.renderTimeSlots();
    this.renderCalendarDays();

    // Reset booking duration
    this.bookingDuration = { hours: 0, minutes: 0 };
  }

  toggleTimeSlot(hour) {
    const dateKey = this.getDateKey(this.selectedDate);
    if (!this.scheduleData[dateKey]) {
      this.scheduleData[dateKey] = [];
    }

    const index = this.scheduleData[dateKey].indexOf(hour);
    const timeSlotElement = document.querySelector(`[data-hour="${hour}"]`);

    if (index === -1) {
      this.scheduleData[dateKey].push(hour);
      timeSlotElement?.classList.add("selected"); // Add selected class
    } else {
      this.scheduleData[dateKey].splice(index, 1);
      timeSlotElement?.classList.remove("selected"); // Remove selected class
    }

    this.saveScheduleData();
    this.renderTimeSlots();
    this.updateCalendarDay(dateKey); // Update calendar to show/hide event indicators
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

    // timeSlotsContainer.addEventListener("click", (e) => {
    //   const timeSlot = e.target.closest(".time-slot");
    //   console.log("timeslot", timeSlot);
    //   if (timeSlot) {
    //     const hour = timeSlot.getAttribute("data-hour");
    //     console.log("hour", hour);
    //     if (this.viewOnly) {
    //       this.deleteBooking(hour, timeSlot);
    //     } else {
    //       this.addBooking(hour);
    //     }
    //   }
    // });
  }
}

// Initialize the schedule manager when the page loads
window.addEventListener("DOMContentLoaded", () => {
  new ScheduleManager();
});
