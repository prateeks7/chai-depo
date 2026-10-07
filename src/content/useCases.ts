export interface UseCase {
  id: string;
  name: string;
  line: string;
}

export const USE_CASES: UseCase[] = [
  { id: 'offices', name: 'Offices', line: 'A proper cup at the press of a button, without the kettle queue.' },
  { id: 'restaurants', name: 'Restaurants', line: 'Consistent chai for every table, from the first order to the last.' },
  { id: 'hotels', name: 'Hotels', line: 'Lobby, breakfast room or staff canteen: chai whenever guests want it.' },
  { id: 'warehouses', name: 'Warehouses', line: 'Keep every shift warm with fast chai at each break.' },
  { id: 'healthcare', name: 'Healthcare', line: 'Comfort for staff and visitors in waiting areas and break rooms.' },
  { id: 'campuses', name: 'Schools & campuses', line: 'Staff rooms and student lounges, with one machine serving many.' },
  { id: 'retail', name: 'Retail', line: 'Offer customers a cup while they browse, and keep staff going.' },
  { id: 'events', name: 'Events', line: 'Rent a machine for conferences, weddings and community events.' },
];
