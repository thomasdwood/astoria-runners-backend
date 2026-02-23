interface EventForMeetup {
  startDateTime: Date;
  endLocation: string | null;
  notes: string | null;
  route: {
    name: string;
    distance: string; // numeric comes back as string from DB
    category: string;
    endLocation: string;
  };
}

export function generateMeetupDescription(event: EventForMeetup): string {
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

  // Determine end location (event override or route default)
  const endLocation = event.endLocation || event.route.endLocation;

  // Strava route link placeholder (route schema doesn't have stravaUrl yet)
  const stravaUrl = 'TBD';

  // Build description
  let description = `Join us for a ${event.route.category} on ${event.route.name}!

Distance: ${event.route.distance} miles
End Location: ${endLocation}
Route: ${stravaUrl}`;

  // Add notes if present
  if (event.notes) {
    description += `\n\n${event.notes}`;
  }

  description += '\n\nSee you there!';

  return description.trim();
}
