// Contact details are taken from the premix labels and the machine wraps.
// verified: false until the client confirms them for the website.
export const site = {
  brand: 'Chai Depo',
  company: 'The Aggarwal Group Inc.',
  phone: { display: '647-470-3480', href: 'tel:+16474703480' },
  tollFree: { display: '1-844-LUV-CHAI', href: 'tel:+18445882424' },
  email: 'sales@chaidepot.ca',
  address: ['173 Advance Blvd, Unit 49', 'Brampton, Ontario L6T 4Z7'],
  verified: false,
} as const;

export const nav = [
  { id: 'flavours', label: 'Flavours' },
  { id: 'machines', label: 'Machines' },
  { id: 'how', label: 'How it works' },
] as const;

// Three statements shown while the cup travels from the machine to centre stage.
// Each is grounded in a control that is visible on the compact machine.
export const promises = [
  { title: 'Same taste, every cup.', detail: 'Premix and hot water, measured by the machine.' },
  { title: 'One press. No kettle.', detail: 'Choose 1, 2 or 3, or a half cup.' },
  { title: 'Rinse, and it’s ready again.', detail: 'Rinse and hot water buttons built in.' },
] as const;
