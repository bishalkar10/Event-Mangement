const timeSlotsContainer = document.getElementById("timeSlotsContainer");

class ScheduleManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.scheduleData = this.loadScheduleData();

    this.initializeCalendar();
    this.attachEventListeners();
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
    // if we click on the same date as selected then close the timeSlot container
    if (this.selectedDate == date) {
      timeSlotsContainer.classList.remove("active");
      this.selectedDate = null;
      return;
    }
    this.selectedDate = date;
    this.renderTimeSlots();
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

    // Create 24 hour slots
    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = document.createElement("div");
      timeSlot.className = "time-slot";
      timeSlot.setAttribute("data-hour", hour);
      if (selectedSlots.includes(hour)) {
        timeSlot.classList.add("selected");
      }

      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      timeSlot.textContent = timeString;

      timeSlot.addEventListener("click", () => this.toggleTimeSlot(hour));
      timeSlots.appendChild(timeSlot);
    }
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
  }
}

// Initialize the schedule manager when the page loads
window.addEventListener("DOMContentLoaded", () => {
  new ScheduleManager();
});
