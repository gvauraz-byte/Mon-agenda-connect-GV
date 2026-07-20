import { DAVClient } from 'tsdav';
import ICAL from 'ical.js';

let client = null;

export async function getClient() {
  if (client) return client;
  if (!process.env.ICLOUD_USERNAME || !process.env.ICLOUD_APP_PASSWORD) {
    throw new Error(
      "ICLOUD_USERNAME et ICLOUD_APP_PASSWORD ne sont pas definis. Ajoute-les dans les variables d'environnement."
    );
  }
  client = new DAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: {
      username: process.env.ICLOUD_USERNAME,
      password: process.env.ICLOUD_APP_PASSWORD,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });
  await client.login();
  return client;
}

export async function listCalendars() {
  const c = await getClient();
  const calendars = await c.fetchCalendars();
  return calendars.filter((cal) => (cal.components || []).includes('VEVENT'));
}

export async function fetchEvents({ start, end }) {
  const c = await getClient();
  const calendars = await listCalendars();
  const results = [];

  for (const cal of calendars) {
    let objects = [];
    try {
      objects = await c.fetchCalendarObjects({
        calendar: cal,
        timeRange: { start, end },
      });
    } catch (err) {
      console.error('Erreur lecture calendrier', cal.displayName, err.message);
      continue;
    }

    for (const obj of objects) {
      if (!obj.data) continue;
      try {
        const jcal = ICAL.parse(obj.data);
        const comp = new ICAL.Component(jcal);
        const vevents = comp.getAllSubcomponents('vevent');
        for (const ve of vevents) {
          const event = new ICAL.Event(ve);
          const categories = ve.getFirstProperty('categories');
          results.push({
            url: obj.url,
            etag: obj.etag,
            calendarUrl: cal.url,
            calendarName: cal.displayName,
            uid: event.uid,
            title: event.summary || '(sans titre)',
            start: event.startDate ? event.startDate.toJSDate().toISOString() : null,
            end: event.endDate ? event.endDate.toJSDate().toISOString() : null,
            allDay: event.startDate ? event.startDate.isDate : false,
            categories: categories ? categories.getValues() : [],
          });
        }
      } catch (err) {
        continue;
      }
    }
  }
  return results;
}

function buildEventICS({ uid, title, start, end, allDay, category }) {
  const comp = new ICAL.Component(['vcalendar', [], []]);
  comp.updatePropertyWithValue('prodid', '-//Agenda Projets//FR');
  comp.updatePropertyWithValue('version', '2.0');

  const vevent = new ICAL.Component('vevent');
  const event = new ICAL.Event(vevent);
  event.uid = uid;
  event.summary = title;

  if (allDay) {
    event.startDate = ICAL.Time.fromDateString(start.slice(0, 10));
    const endDate = ICAL.Time.fromDateString((end || start).slice(0, 10));
    endDate.day += 1;
    event.endDate = endDate;
  } else {
    event.startDate = ICAL.Time.fromJSDate(new Date(start), false);
    event.endDate = ICAL.Time.fromJSDate(new Date(end || start), false);
  }

  if (category) {
    vevent.updatePropertyWithValue('categories', category);
  }
  vevent.updatePropertyWithValue('dtstamp', ICAL.Time.now());

  comp.addSubcomponent(vevent);
  return comp.toString();
}

export async function createEvent({ title, start, end, allDay, category, calendarUrl }) {
  const c = await getClient();
  const calendars = await listCalendars();
  const targetCal = calendarUrl
    ? calendars.find((cal) => cal.url === calendarUrl)
    : calendars[0];
  if (!targetCal) throw new Error('Aucun calendrier iCloud disponible pour ecrire cet evenement.');

  const uid = `agenda-projets-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ics = buildEventICS({ uid, title, start, end, allDay, category });

  const result = await c.createCalendarObject({
    calendar: targetCal,
    filename: `${uid}.ics`,
    iCalString: ics,
  });
  return { ok: true, status: result.status };
}

export async function deleteEvent({ url, etag }) {
  const c = await getClient();
  await c.deleteCalendarObject({
    calendarObject: { url, etag },
  });
  return { ok: true };
}
