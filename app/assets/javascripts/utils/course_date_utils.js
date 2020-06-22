import { filter } from 'lodash-es';
import moment from 'moment';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';

require('moment-recur');

dayjs.extend(localeData);
dayjs.extend(weekday);

const CourseDateUtils = {
  validationRegex() {
    // Matches YYYY-MM-DD
    return /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])$/;
  },

  isDateValid(date) {
    return /^20\d{2}-\d{2}-\d{2}/.test(date) && dayjs(date, 'YYYY-MM-DD').format('YYYY-MM-DD') === date;
  },


  formattedDateTime(datetime, showTime = false) {
    let timeZoneAbbr = '';
    let timeFormat = '';

    if (showTime) {
      timeFormat = ' HH:mm';
      try {
        timeZoneAbbr = ' ';
        timeZoneAbbr += dayjs(datetime).toDate().toString().split('(')[1].slice(0, -1);
      } catch (err) {
        timeZoneAbbr = '';
      }
    }
    const format = `YYYY-MM-DD${timeFormat}`;
    return dayjs(datetime).format(format) + timeZoneAbbr;
  },

  // Returns an object of minDate and maxDate props for each date field of a course
  dateProps(course) {
    const startDate = dayjs(course.start, 'YYYY-MM-DD');

    const props = {
      end: {
        minDate: startDate
      },
      timeline_start: {
        minDate: startDate,
        maxDate: dayjs(course.timeline_end, 'YYYY-MM-DD')
      },
      timeline_end: {
        minDate: dayjs(course.timeline_start, 'YYYY-MM-DD'),
        maxDate: dayjs(course.end, 'YYYY-MM-DD')
      }
    };

    return props;
  },

  // This method takes a current version of a course and an updated key-value pair
  // for changing one of the date fields and returns a course where all the dates
  // are consistent with each other.
  updateCourseDates(prevCourse, valueKey, value) {
    const updatedCourse = $.extend({}, prevCourse);
    updatedCourse[valueKey] = value;
    // Just return with the new value if it doesn't pass validation
    // or if it it lacks timeline dates
    if (!this.isDateValid(value) || !updatedCourse.timeline_start) { return updatedCourse; }

    if (dayjs(updatedCourse.start, 'YYYY-MM-DD').isAfter(dayjs(updatedCourse.timeline_start, 'YYYY-MM-DD')) && valueKey !== 'timeline_start') {
      updatedCourse.timeline_start = updatedCourse.start;
    }
    if (dayjs(updatedCourse.timeline_start, 'YYYY-MM-DD').isAfter(dayjs(updatedCourse.timeline_end, 'YYYY-MM-DD')) && valueKey !== 'timeline_end') {
      updatedCourse.timeline_end = updatedCourse.timeline_start;
    }
    if (dayjs(updatedCourse.timeline_end, 'YYYY-MM-DD').isAfter(dayjs(updatedCourse.end, 'YYYY-MM-DD')) && valueKey !== 'end') {
      updatedCourse.end = updatedCourse.timeline_end;
    }
    if (dayjs(updatedCourse.start, 'YYYY-MM-DD').isAfter(dayjs(updatedCourse.timeline_start, 'YYYY-MM-DD')) && valueKey !== 'timeline_start') {
      updatedCourse.timeline_start = updatedCourse.start;
    }
    if (dayjs(updatedCourse.timeline_start, 'YYYY-MM-DD').isAfter(dayjs(updatedCourse.end)) && valueKey !== 'timeline_start') {
      updatedCourse.timeline_start = updatedCourse.end;
    }

    // If the dates were changed by extending the course end, and the assignment end
    // was previously the same as the course end, then extend the timeline end to match.
    if (prevCourse.end === prevCourse.timeline_end && valueKey !== 'timeline_end') {
      updatedCourse.timeline_end = updatedCourse.end;
    }

    return updatedCourse;
  },

  moreWeeksThanAvailable(course, weeks, exceptions) {
    if (!weeks || !weeks.length) { return false; }
    const nonBlackoutWeeks = filter(this.weekMeetings(this.meetings(course), course, exceptions), mtg => mtg !== '()');
    return weeks.length > nonBlackoutWeeks.length;
  },


  wouldCreateBlackoutWeek(course, day, exceptions) {
    const selectedDay = dayjs(day);
    let noMeetingsThisWeek = true;
    [0, 1, 2, 3, 4, 5, 6].forEach((i) => {
      const wkDay = selectedDay.day(0).add(i, 'day').format('YYYYMMDD');
      if (this.courseMeets(course.weekdays, i, wkDay, exceptions.join(','))) { return noMeetingsThisWeek = false; }
    });
    return noMeetingsThisWeek;
  },

  weeksBeforeTimeline(course) {
    const courseStart = dayjs(course.start).startOf('week');
    const timelineStart = dayjs(course.timeline_start).startOf('week');
    return timelineStart.diff(courseStart, 'week');
  },

  // Returns string describing weekday meetings for each week
  // Ex: ["(M, W, F)", "(M, W)", "()", "(W, T)", "(M, W, F)"]
  weekMeetings(recurrence, course, exceptions) {
    if (!recurrence) { return []; }
    const weekEnd = recurrence.endDate();
    weekEnd.day(6);
    let weekStart = recurrence.startDate();
    const firstWeekStart = recurrence.startDate().day();
    weekStart.day(0);
    const courseWeeks = Math.ceil(weekEnd.diff(weekStart, 'weeks', true));
    if (!recurrence.rules || recurrence.rules[0].measure !== 'daysOfWeek') {
      return [];
    }

    const meetings = [];

    __range__(0, (courseWeeks - 1), true).forEach((week) => {
      weekStart = dayjs(recurrence.startDate()).startOf('week').add(week, 'week');

      // Account for the first partial week, which may not have 7 days.
      let firstDayOfWeek;
      if (week === 0) {
        firstDayOfWeek = firstWeekStart;
      } else {
        firstDayOfWeek = 0;
      }

      const ms = [];
      __range__(firstDayOfWeek, 6, true).forEach((i) => {
        const day = dayjs(weekStart).add(i, 'day');
        if (course && this.courseMeets(course.weekdays, i, day.format('YYYYMMDD'), exceptions)) {
          return ms.push(day.format('ddd'));
        }
      });
      if (ms.length === 0) {
        return meetings.push('()');
      }
      return meetings.push(`(${ms.join(', ')})`);
    });
    return meetings;
  },

  meetings(course) {
    let meetings;
    if (course.weekdays) {
      meetings = moment().recur(course.timeline_start, course.timeline_end);
      const weekdays = [];
      course.weekdays.split('').forEach((wd, i) => {
        if (wd !== '1') { return; }
        const day = dayjs().weekday(i);
        return weekdays.push(dayjs.localeData().weekdaysShort(day));
      });
      meetings.every(weekdays).daysOfWeek();
      course.day_exceptions.split(',').forEach((e) => {
        if (e.length > 0) { return meetings.except(dayjs(e, 'YYYYMMDD')); }
      });
    }
    return meetings;
  },

  courseMeets(weekdays, i, formatted, exceptions) {
    if (!exceptions && exceptions !== '') { return false; }
    exceptions = exceptions.split ? exceptions.split(',') : exceptions;
    if (weekdays[i] === '1' && !__in__(formatted, exceptions)) { return true; }
    if (weekdays[i] === '0' && __in__(formatted, exceptions)) { return true; }
    return false;
  },

  // Takes a week weekMeetings array and returns the count of non-empty weeks
  openWeeks(weekMeetings) {
    let openWeekCount = 0;
    weekMeetings.forEach((meetingString) => {
      if (meetingString !== '()') { return openWeekCount += 1; }
    });
    return openWeekCount;
  },

  isEnded(course) {
    return dayjs(course.end, 'YYYY-MM-DD').isBefore();
  },

  currentWeekIndex(timelineStart) {
    return Math.max(dayjs().startOf('week').diff(dayjs(timelineStart).startOf('week'), 'week'), 0);
  },

  currentWeekOrder(timelineStart) {
    // Week order is indexed from 1, so we add 1 to the number of weeks that have
    // passed since the start of the timeline to get the current week.
    return this.currentWeekIndex(timelineStart) + 1;
  }
};

function __range__(left, right, inclusive) {
  const range = [];
  const ascending = left < right;

  let endOfRange;
  if (!inclusive) {
    endOfRange = right;
  } else if (ascending) {
    endOfRange = right + 1;
  } else {
    endOfRange = right - 1;
  }

  for (let i = left; ascending ? i < endOfRange : i > endOfRange; ascending ? i += 1 : i -= 1) {
    range.push(i);
  }
  return range;
}

function __in__(needle, haystack) {
  return haystack.indexOf(needle) >= 0;
}

export default CourseDateUtils;
