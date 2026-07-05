import { google, calendar_v3 } from "googleapis";

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  location?: string;
}

export interface CalendarProvider {
  readonly id: string;
  isConfigured(): boolean;
  getEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]>;
  createEvent(event: CalendarEvent): Promise<CalendarEvent>;
}

export class GoogleCalendarProvider implements CalendarProvider {
  readonly id = "google-calendar";
  private calendar: calendar_v3.Calendar | null = null;
  private configured = false;

  constructor(
    private readonly clientId: string | undefined = process.env.GOOGLE_CLIENT_ID,
    private readonly clientSecret: string | undefined = process.env.GOOGLE_CLIENT_SECRET,
    private readonly redirectUri: string | undefined = process.env.GOOGLE_REDIRECT_URI,
    private readonly refreshToken: string | undefined = process.env.GOOGLE_REFRESH_TOKEN,
  ) {
    if (this.clientId && this.clientSecret && this.refreshToken) {
      const auth = new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
      auth.setCredentials({ refresh_token: this.refreshToken });
      this.calendar = google.calendar({ version: "v3", auth });
      this.configured = true;
    }
  }

  isConfigured(): boolean {
    return this.configured && this.calendar !== null;
  }

  async getEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error("Google Calendar Provider is not configured.");
    }

    const response = await this.calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.data.items ?? []).map((item) => ({
      id: item.id || undefined,
      title: item.summary || "Untitled Event",
      description: item.description || undefined,
      startTime: item.start?.dateTime || item.start?.date || "",
      endTime: item.end?.dateTime || item.end?.date || "",
      location: item.location || undefined,
    }));
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    if (!this.calendar) {
      throw new Error("Google Calendar Provider is not configured.");
    }

    const response = await this.calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startTime },
        end: { dateTime: event.endTime },
        location: event.location,
      },
    });

    return {
      id: response.data.id || undefined,
      title: response.data.summary || event.title,
      description: response.data.description || undefined,
      startTime: response.data.start?.dateTime || response.data.start?.date || event.startTime,
      endTime: response.data.end?.dateTime || response.data.end?.date || event.endTime,
      location: response.data.location || undefined,
    };
  }
}

export class NoopCalendarProvider implements CalendarProvider {
  readonly id = "noop";

  isConfigured(): boolean {
    return false;
  }

  async getEvents(): Promise<CalendarEvent[]> {
    console.warn("NoopCalendarProvider: getEvents called");
    return [];
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    console.warn("NoopCalendarProvider: createEvent called");
    return event;
  }
}

export function getCalendarProvider(): CalendarProvider {
  const provider = new GoogleCalendarProvider();
  if (provider.isConfigured()) {
    return provider;
  }
  return new NoopCalendarProvider();
}
