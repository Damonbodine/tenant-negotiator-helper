
export interface DownPaymentProgram {
  id: string;
  name: string;
  state: string;
  eligibilityRequirements: string;
  benefits: string;
  link?: string;
  agencyName: string;
  incomeLimit?: string;
  firstTimeOnly: boolean;
}

// Data based on the provided Google Sheet
export const downPaymentPrograms: DownPaymentProgram[] = [
  {
    id: "fha-loan",
    name: "FHA Loan Program",
    state: "All States",
    eligibilityRequirements: "3.5% down payment with 580+ credit score; 10% down with 500-579 credit score",
    benefits: "Low down payment, more flexible credit requirements",
    link: "https://www.hud.gov/buying/loans",
    agencyName: "Federal Housing Administration",
    firstTimeOnly: false
  },
  {
    id: "va-loan",
    name: "VA Home Loans",
    state: "All States",
    eligibilityRequirements: "Must be active-duty service member, veteran, or eligible surviving spouse",
    benefits: "No down payment, no PMI, competitive interest rates",
    link: "https://www.va.gov/housing-assistance/home-loans/",
    agencyName: "U.S. Department of Veterans Affairs",
    firstTimeOnly: false
  },
  {
    id: "usda-loan",
    name: "USDA Rural Development Loan",
    state: "All States",
    eligibilityRequirements: "Low to moderate income, property in eligible rural area",
    benefits: "No down payment, lower mortgage insurance, lower interest rates",
    link: "https://www.rd.usda.gov/programs-services/single-family-housing-programs",
    agencyName: "U.S. Department of Agriculture",
    firstTimeOnly: false
  },
  {
    id: "ca-firsttime",
    name: "California First-Time Homebuyer Programs",
    state: "California",
    eligibilityRequirements: "First-time homebuyer, income limits vary by county",
    benefits: "Down payment assistance up to 3.5% of purchase price or appraised value",
    link: "https://www.calhfa.ca.gov/homebuyer/",
    agencyName: "California Housing Finance Agency",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "ny-sonyma",
    name: "SONYMA Down Payment Assistance Loan",
    state: "New York",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Up to $15,000 in down payment assistance",
    link: "https://hcr.ny.gov/sonyma",
    agencyName: "State of New York Mortgage Agency",
    incomeLimit: "$105,600 for 1-2 person households in most areas",
    firstTimeOnly: true
  },
  {
    id: "tx-bond",
    name: "Texas Bond Programs",
    state: "Texas",
    eligibilityRequirements: "First-time homebuyer (or not owned in past 3 years), income limits",
    benefits: "Down payment and closing cost assistance",
    link: "https://www.tdhca.state.tx.us/homeownership/",
    agencyName: "Texas Department of Housing & Community Affairs",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "fl-assistance",
    name: "Florida Housing First Time Homebuyer Program",
    state: "Florida",
    eligibilityRequirements: "First-time homebuyer, credit score 640+, income limits",
    benefits: "Down payment and closing cost assistance up to $10,000",
    link: "https://www.floridahousing.org/programs/homebuyer-overview-page",
    agencyName: "Florida Housing Finance Corporation",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "il-ihda",
    name: "IHDA Access Programs",
    state: "Illinois",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Down payment assistance up to $10,000",
    link: "https://www.ihda.org/homeowners/buying-a-house/",
    agencyName: "Illinois Housing Development Authority",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "pa-keystone",
    name: "Keystone Home Loan Program",
    state: "Pennsylvania",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Down payment and closing cost assistance up to $6,000",
    link: "https://www.phfa.org/programs/assistance.aspx",
    agencyName: "Pennsylvania Housing Finance Agency",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "oh-firsthome",
    name: "Ohio First-Time Homebuyer Program",
    state: "Ohio",
    eligibilityRequirements: "First-time homebuyer, income limits, purchase price limits",
    benefits: "Down payment assistance up to 2.5% of purchase price",
    link: "https://myohiohome.org/homebuyer/",
    agencyName: "Ohio Housing Finance Agency",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "mi-mshda",
    name: "Michigan Down Payment Assistance Program",
    state: "Michigan",
    eligibilityRequirements: "First-time homebuyer, income limits, purchase price limits",
    benefits: "Up to $7,500 in down payment assistance",
    link: "https://www.michigan.gov/mshda/homeownership",
    agencyName: "Michigan State Housing Development Authority",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "ga-dream",
    name: "Georgia Dream Homeownership Program",
    state: "Georgia",
    eligibilityRequirements: "First-time homebuyer (or not owned in past 3 years), income limits",
    benefits: "Up to $7,500 in down payment assistance",
    link: "https://www.dca.ga.gov/safe-affordable-housing/homeownership/georgia-dream",
    agencyName: "Georgia Department of Community Affairs",
    incomeLimit: "$79,200 for 1-2 person households in most areas",
    firstTimeOnly: true
  },
  {
    id: "nc-home",
    name: "NC Home Advantage Mortgage",
    state: "North Carolina",
    eligibilityRequirements: "First-time and repeat buyers, income limits, credit score 640+",
    benefits: "Down payment assistance up to 5% of loan amount",
    link: "https://www.nchfa.com/home-buyers/buy-home",
    agencyName: "North Carolina Housing Finance Agency",
    incomeLimit: "$89,000 in most areas",
    firstTimeOnly: false
  },
  {
    id: "ma-oneloan",
    name: "ONE Mortgage Program",
    state: "Massachusetts",
    eligibilityRequirements: "First-time homebuyer, income limits, complete homebuyer education",
    benefits: "Low down payment, no PMI, below-market interest rates",
    link: "https://www.mhp.net/one-mortgage",
    agencyName: "Massachusetts Housing Partnership",
    incomeLimit: "Varies by region",
    firstTimeOnly: true
  },
  {
    id: "wa-homechoice",
    name: "Home Advantage Program",
    state: "Washington",
    eligibilityRequirements: "Income limits, credit score 620+, homebuyer education",
    benefits: "Down payment assistance up to 4% of loan amount",
    link: "https://www.wshfc.org/buyers/",
    agencyName: "Washington State Housing Finance Commission",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  }
];

export const getAllStates = (): string[] => {
  const states = downPaymentPrograms.map(program => program.state);
  const uniqueStates = Array.from(new Set(states)).sort();
  return uniqueStates;
};

export const getFilteredPrograms = (selectedState: string | null): DownPaymentProgram[] => {
  if (!selectedState || selectedState === "All States") {
    return downPaymentPrograms;
  }
  return downPaymentPrograms.filter(program => 
    program.state === selectedState || program.state === "All States"
  );
};
