function schedule() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
    const scheduler = sheet.getSheetByName("Scheduler")
    const planner = sheet.getSheetByName("Planner")

    const schedule = scheduler.getDataRange().getValues()
    schedule[1] = schedule[1].slice(0, 5)
    schedule[2] = schedule[2].slice(0, 5)
    const start_date = scheduler.getRange(1, 7).getValue()
    const end_date = scheduler.getRange(2, 7).getValue()
    schedule.shift()

    let plan = []
    const set_dates = new Set()
    const duped_dates = new Set()

    schedule.forEach(s => {
        const dates = getScheduleDates(s[1], s[2], start_date, end_date)
        dates.forEach(date => {
            const datestr = date.toDateString()
            plan.push(["", date, s[0], s[3], s[4]])
            if (set_dates.has(datestr)) {
                duped_dates.add(datestr)
            } else {
                set_dates.add(datestr)
            }
        })
    })
    plan = plan.filter(s => !s[4] || !duped_dates.has(s[1].toDateString())).sort((a, b) => a[1] - b[1]).map(s => s.slice(0, 4))
    plan.forEach(row => planner.appendRow(row))
}

function getScheduleDates(cadence, day, start_date, end_date) {
    const dates = []
    for (let d = new Date(start_date); d <= end_date; d.setDate(d.getDate() + 1)) {
        if (matchesSchedule(d, cadence, day)) {
            dates.push(new Date(d))
        }
    }
    return dates
}

function matchesSchedule(date, cadence, day) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[date.getDay()]

    if (cadence === 'Every') {
        return dayName === day
    }

    const weekdaysInMonth = getWeekdaysInMonth(date.getFullYear(), date.getMonth(), day)

    if (cadence === 'Last') {
        return sameDate(date, weekdaysInMonth.pop())
    }

    const index = Number(cadence.charAt(0)) - 1
    return sameDate(date, weekdaysInMonth[index])
}

function getWeekdaysInMonth(year, month, weekdayName) {
    const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
    const weekday = dayMap[weekdayName]
    const dates = []
    const date = new Date(year, month, 1)

    while (date.getMonth() === month) {
        if (date.getDay() === weekday) {
            dates.push(new Date(date))
        }
        date.setDate(date.getDate() + 1)
    }
    return dates
}

function sameDate(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}