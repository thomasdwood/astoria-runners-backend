interface EventForMeetup {
  startDateTime: Date;
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  route: {
    name: string;
    distance: string; // numeric comes back as string from DB
    stravaUrl: string | null;
    startLocation: string | null;
    endLocation: string | null;
    category: {
      id: number;
      name: string;
      color: string;
      icon: string;
    };
  };
}

export function generateMeetupDescription(event: EventForMeetup, format: 'plain' | 'html' = 'plain'): string {
  // Format date with timezone
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }).format(event.startDateTime);

  const categoryName = event.route.category.name;
  const routeName = event.route.name;
  const distance = Number(event.route.distance);

  // Determine start location (event override or route default)
  const startLocation = event.startLocation || event.route.startLocation;

  // Determine end location (event override or route default)
  const endLocation = event.endLocation || event.route.endLocation;

  const stravaUrl = event.route.stravaUrl;

  if (format === 'html') {
    return generateHtmlDescription({
      categoryName,
      routeName,
      distance,
      startLocation,
      endLocation,
      stravaUrl,
      notes: event.notes,
      formattedDate,
    });
  }

  return generatePlainDescription({
    categoryName,
    routeName,
    distance,
    startLocation,
    endLocation,
    stravaUrl,
    notes: event.notes,
    formattedDate,
  });
}

interface DescriptionParams {
  categoryName: string;
  routeName: string;
  distance: number;
  startLocation: string | null | undefined;
  endLocation: string | null | undefined;
  stravaUrl: string | null | undefined;
  notes: string | null | undefined;
  formattedDate: string;
}

function generatePlainDescription(params: DescriptionParams): string {
  const { categoryName, routeName, distance, startLocation, endLocation, stravaUrl, notes, formattedDate } = params;

  let description = `Join us for a ${categoryName} on ${routeName}!\n\n`;
  description += `Date: ${formattedDate}\n`;
  description += `Distance: ${distance} miles\n`;

  if (startLocation) {
    description += `Start: ${startLocation}\n`;
  }

  if (endLocation && endLocation !== startLocation) {
    description += `End: ${endLocation}\n`;
  }

  if (stravaUrl) {
    description += `Route: ${stravaUrl}\n`;
  }

  if (notes) {
    description += `\n${notes}\n`;
  }

  description += '\nSee you there!';

  return description.trim();
}

function generateHtmlDescription(params: DescriptionParams): string {
  const { categoryName, routeName, distance, startLocation, endLocation, stravaUrl, notes, formattedDate } = params;

  let html = `<p>Join us for a ${categoryName} on <b>${routeName}</b>!</p>\n`;
  html += `<p><b>Date:</b> ${formattedDate}<br>\n`;
  html += `<b>Distance:</b> ${distance} miles<br>\n`;

  if (startLocation) {
    html += `<b>Start:</b> ${startLocation}<br>\n`;
  }

  if (endLocation && endLocation !== startLocation) {
    html += `<b>End:</b> ${endLocation}<br>\n`;
  }

  if (stravaUrl) {
    html += `<b>Route:</b> <a href="${stravaUrl}">View on Strava</a><br>\n`;
  }

  html += `</p>\n`;

  if (notes) {
    html += `<p>${notes}</p>\n`;
  }

  html += `<p>See you there!</p>`;

  return html.trim();
}
