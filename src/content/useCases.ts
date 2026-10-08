export interface UseCase {
  id: string;
  name: string;
  /** The bold claim for this venue. */
  headline: string;
  line: string;
}

export const USE_CASES: UseCase[] = [
  {
    id: 'offices',
    name: 'Offices',
    headline: 'Better breaks, without the kettle.',
    line: 'Serve chai, coffee and other hot beverages at the press of a button.',
  },
  {
    id: 'restaurants',
    name: 'Restaurants',
    headline: 'Consistent flavour, every time.',
    line: 'Give your customers and staff a quick, reliable cup without the extra preparation.',
  },
  {
    id: 'hotels',
    name: 'Hotels',
    headline: 'A warm welcome, anytime.',
    line: 'Perfect for breakfast rooms, lobbies, guest areas and staff spaces.',
  },
  {
    id: 'warehouses',
    name: 'Warehouses & workplaces',
    headline: 'Keep every shift going.',
    line: 'Fast, convenient hot beverages for teams who need a break without leaving the floor.',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    headline: 'Comfort for staff and visitors.',
    line: 'An easy beverage solution for waiting areas, staff rooms and common spaces.',
  },
  {
    id: 'campuses',
    name: 'Schools & campuses',
    headline: 'One machine. Something for everyone.',
    line: 'A convenient hot beverage option for staff rooms, student spaces and campus facilities.',
  },
  {
    id: 'retail',
    name: 'Retail',
    headline: 'Serve more than just products.',
    line: 'Offer customers and staff a fresh cup while they shop, work or take a break.',
  },
  {
    id: 'events',
    name: 'Events',
    headline: 'Bring the cup to the crowd.',
    line: 'Machine rentals for conferences, weddings, community events and special occasions.',
  },
];
