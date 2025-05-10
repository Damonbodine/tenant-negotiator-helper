
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

// Data based on the complete Google Sheet
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
  },
  // Adding more programs from the Google Sheet
  {
    id: "az-home-plus",
    name: "Home Plus Program",
    state: "Arizona",
    eligibilityRequirements: "Income limits, credit score 640+, purchase price limits",
    benefits: "Down payment assistance up to 5% of loan amount",
    link: "https://www.azhousing.gov/homeownership/home-plus",
    agencyName: "Arizona Department of Housing",
    incomeLimit: "$92,000 in most areas",
    firstTimeOnly: false
  },
  {
    id: "co-chfa",
    name: "CHFA Down Payment Assistance Grant",
    state: "Colorado",
    eligibilityRequirements: "Income limits, credit score 620+, complete homebuyer education",
    benefits: "Down payment assistance up to 3% of first mortgage",
    link: "https://www.chfainfo.com/homeownership",
    agencyName: "Colorado Housing and Finance Authority",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  },
  {
    id: "ct-chfa",
    name: "CHFA Down Payment Assistance Program",
    state: "Connecticut",
    eligibilityRequirements: "First-time homebuyer, income limits vary by county",
    benefits: "Low-interest loans up to $20,000 for down payment assistance",
    link: "https://www.chfa.org/homebuyers/chfa-mortage-programs/",
    agencyName: "Connecticut Housing Finance Authority",
    incomeLimit: "Varies by county and family size",
    firstTimeOnly: true
  },
  {
    id: "de-dsha",
    name: "Delaware First-Time Homebuyer Tax Credit",
    state: "Delaware",
    eligibilityRequirements: "First-time homebuyer, income limits, purchase price limits",
    benefits: "Federal tax credit up to $2,000 per year for the life of the mortgage",
    link: "https://www.destatehousing.com/HomeOwnership/homeownership.php",
    agencyName: "Delaware State Housing Authority",
    incomeLimit: "$97,200 for 1-2 person households",
    firstTimeOnly: true
  },
  {
    id: "md-mmp",
    name: "Maryland Mortgage Program",
    state: "Maryland",
    eligibilityRequirements: "First-time homebuyer in most cases, income limits, purchase price limits",
    benefits: "Down payment assistance up to $5,000, competitive interest rates",
    link: "https://mmp.maryland.gov/Pages/About-CDA-Finance.aspx",
    agencyName: "Maryland Department of Housing and Community Development",
    incomeLimit: "Varies by county and household size",
    firstTimeOnly: true
  },
  {
    id: "mn-start",
    name: "Minnesota Start Up Program",
    state: "Minnesota",
    eligibilityRequirements: "First-time homebuyer, income limits, purchase price limits",
    benefits: "Low fixed interest rates, down payment and closing cost loans up to $15,000",
    link: "http://www.mnhousing.gov/sites/np/homebuyers",
    agencyName: "Minnesota Housing Finance Agency",
    incomeLimit: "Varies by county and household size",
    firstTimeOnly: true
  },
  {
    id: "nj-hjsa",
    name: "New Jersey Housing and Mortgage Finance Agency",
    state: "New Jersey",
    eligibilityRequirements: "First-time homebuyers, income and purchase price limits",
    benefits: "Down payment assistance up to $10,000 as a five-year, interest-free, forgivable loan",
    link: "https://www.njhousing.gov/dca/hmfa/homeownership/buyers/",
    agencyName: "New Jersey Housing and Mortgage Finance Agency",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "nm-fthb",
    name: "New Mexico First Home Program",
    state: "New Mexico",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Down payment assistance up to $8,000 as a second mortgage",
    link: "http://www.housingnm.org/homebuyers/first-home",
    agencyName: "New Mexico Mortgage Finance Authority",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "or-odha",
    name: "Oregon Down Payment Assistance",
    state: "Oregon",
    eligibilityRequirements: "First-time homebuyer, income limits varying by region",
    benefits: "Low-interest loans up to $15,000 for down payment and closing costs",
    link: "https://www.oregon.gov/ohcs/homeownership/pages/homebuyer-assistance.aspx",
    agencyName: "Oregon Housing and Community Services",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "sc-homebuyer",
    name: "SC Housing Homebuyer Program",
    state: "South Carolina",
    eligibilityRequirements: "Income and purchase price limits, minimum credit score of 620",
    benefits: "Forgivable down payment assistance up to $6,000",
    link: "https://www.schousing.com/Home/HomeBuyerProgram",
    agencyName: "South Carolina State Housing Finance and Development Authority",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  },
  {
    id: "tn-great-choice",
    name: "Great Choice Home Loan Program",
    state: "Tennessee",
    eligibilityRequirements: "Credit score of 640+, income and purchase price limits",
    benefits: "Down payment assistance up to $7,500 as a second mortgage",
    link: "https://thda.org/homebuyers/great-choice-home-loans",
    agencyName: "Tennessee Housing Development Agency",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  },
  {
    id: "va-vhda",
    name: "Virginia Housing Down Payment Assistance",
    state: "Virginia",
    eligibilityRequirements: "First-time homebuyer in most cases, income and purchase price limits",
    benefits: "Down payment assistance up to 2.5% of home purchase price",
    link: "https://www.vhda.com/Homebuyers/Pages/DownPaymentAssistance.aspx",
    agencyName: "Virginia Housing Development Authority",
    incomeLimit: "Varies by region",
    firstTimeOnly: true
  },
  {
    id: "wi-advantage",
    name: "WHEDA Advantage Programs",
    state: "Wisconsin",
    eligibilityRequirements: "Income and purchase price limits, credit score of 620+",
    benefits: "Down payment assistance up to 6% of the home purchase price or $12,000, whichever is less",
    link: "https://www.wheda.com/homeownership/available-programs/",
    agencyName: "Wisconsin Housing and Economic Development Authority",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  },
  {
    id: "ak-program",
    name: "Alaska Housing First-Time Homebuyer Program",
    state: "Alaska",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Lower interest rates and reduced mortgage insurance",
    link: "https://www.ahfc.us/buy/loan-programs",
    agencyName: "Alaska Housing Finance Corporation",
    incomeLimit: "Varies by region",
    firstTimeOnly: true
  },
  {
    id: "al-program",
    name: "Step Up Program",
    state: "Alabama",
    eligibilityRequirements: "Minimum credit score of 640, income limits",
    benefits: "Down payment assistance up to 3% of loan amount",
    link: "https://www.ahfa.com/homebuyers/programs-for-homebuyers",
    agencyName: "Alabama Housing Finance Authority",
    incomeLimit: "$97,300 for most counties",
    firstTimeOnly: false
  },
  {
    id: "ar-program",
    name: "ADFA Move-Up Program",
    state: "Arkansas",
    eligibilityRequirements: "Income and purchase price limits",
    benefits: "Down payment assistance up to 3.5% of loan amount",
    link: "https://www.arkansas.gov/adfa/homeownership-programs/",
    agencyName: "Arkansas Development Finance Authority",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  },
  {
    id: "hi-program",
    name: "Hawaii First-Time Home Buyer's Program",
    state: "Hawaii",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Below-market interest rates on 30-year fixed mortgages",
    link: "http://dbedt.hawaii.gov/hhfdc/home-ownership/",
    agencyName: "Hawaii Housing Finance and Development Corporation",
    incomeLimit: "Varies by county and family size",
    firstTimeOnly: true
  },
  {
    id: "ia-firsthome",
    name: "FirstHome Program",
    state: "Iowa",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Down payment assistance up to $5,000",
    link: "https://www.iowafinance.com/homeownership/first-home-program/",
    agencyName: "Iowa Finance Authority",
    incomeLimit: "Varies by county and household size",
    firstTimeOnly: true
  },
  {
    id: "id-program",
    name: "Idaho Housing First Loan Program",
    state: "Idaho",
    eligibilityRequirements: "Income limits, credit score requirements",
    benefits: "Down payment and closing cost assistance up to 3.5% of loan amount",
    link: "https://www.idahohousing.com/homebuyers/",
    agencyName: "Idaho Housing and Finance Association",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  },
  {
    id: "ks-program",
    name: "First-Time Homebuyer Program",
    state: "Kansas",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Down payment assistance up to 5% of loan amount",
    link: "https://www.khrc.org/first-time-homebuyer",
    agencyName: "Kansas Housing Resources Corporation",
    incomeLimit: "Varies by county",
    firstTimeOnly: true
  },
  {
    id: "ky-program",
    name: "Kentucky Housing Corporation Programs",
    state: "Kentucky",
    eligibilityRequirements: "Income limits, credit score of 640+",
    benefits: "Down payment assistance up to $6,000",
    link: "https://www.kyhousing.org/Homeownership/Pages/default.aspx",
    agencyName: "Kentucky Housing Corporation",
    incomeLimit: "Varies by county",
    firstTimeOnly: false
  },
  {
    id: "la-program",
    name: "LHC Mortgage Revenue Bond Programs",
    state: "Louisiana",
    eligibilityRequirements: "First-time homebuyer, income and purchase price limits",
    benefits: "Down payment and closing cost assistance up to 4% of loan amount",
    link: "https://www.lhc.la.gov/homebuyers",
    agencyName: "Louisiana Housing Corporation",
    incomeLimit: "Varies by parish",
    firstTimeOnly: true
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
