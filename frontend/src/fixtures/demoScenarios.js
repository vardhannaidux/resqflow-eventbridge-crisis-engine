/**
 * ResQFlow X — Tactical Demo Scenarios & Seeded Resource Registry
 * EXPLICIT NOTICE: ALL DATA IN THIS FILE REPRESENTS SIMULATED DEMO FIXTURES
 * FOR HACKATHON EVALUATION ONLY. NOT LIVE EMERGENCY OPERATIONAL DATA.
 */

export const HYDERABAD_PRESETS = [
  { name: 'Secunderabad Commercial Zone', latitude: 17.4399, longitude: 78.4983, zone: 'North Sector' },
  { name: 'Jubilee Hills Road 36', latitude: 17.4319, longitude: 78.4073, zone: 'West Sector' },
  { name: 'Hitec City Cyber Towers', latitude: 17.4474, longitude: 78.3762, zone: 'IT Corridor' },
  { name: 'Charminar Heritage District', latitude: 17.3616, longitude: 78.4747, zone: 'South Sector' },
  { name: 'Gachibowli Stadium Junction', latitude: 17.4401, longitude: 78.3489, zone: 'Financial District' },
  { name: 'Begumpet Airport Environs', latitude: 17.4531, longitude: 78.4678, zone: 'Central Sector' }
];

export const DEMO_SCENARIOS = [
  {
    id: 'SCENARIO-ALPHA',
    title: 'Drill Alpha: Multi-Floor Commercial Fire',
    category: 'FIRE',
    severity: 'CRITICAL',
    peopleAffected: 15,
    location: { latitude: 17.4399, longitude: 78.4983 },
    locationName: 'Secunderabad Commercial Complex',
    description: 'Multi-floor structure fire with heavy smoke entrapment on levels 3-5. Multiple casualties reported.',
    recommendedTeam: 'ERT-Hyderabad-Alpha (Special Rapid Deployment)',
    recommendedHospital: 'Apollo Emergency & Trauma Care, Hyderabad',
    etaMinutes: 8,
    reportedBy: 'SIMULATION-DRILL-ALPHA'
  },
  {
    id: 'SCENARIO-BRAVO',
    title: 'Drill Bravo: Transit Bus Collision',
    category: 'MEDICAL',
    severity: 'HIGH',
    peopleAffected: 7,
    location: { latitude: 17.4319, longitude: 78.4073 },
    locationName: 'Jubilee Hills Road 36 Intersection',
    description: 'Mass-transit bus collision involving multiple passenger vehicles with entrapped injuries requiring trauma extraction.',
    recommendedTeam: 'PRT-Hyderabad-Bravo (Priority Tactical Unit)',
    recommendedHospital: 'KIMS Regional Trauma Center, Hyderabad',
    etaMinutes: 15,
    reportedBy: 'SIMULATION-DRILL-BRAVO'
  },
  {
    id: 'SCENARIO-CHARLIE',
    title: 'Drill Charlie: Hazardous Chemical Spill',
    category: 'ACCIDENT',
    severity: 'MEDIUM',
    peopleAffected: 2,
    location: { latitude: 17.4474, longitude: 78.3762 },
    locationName: 'Hitec City Flyover',
    description: 'Industrial transport tanker leak. Roadway shutdown in progress; no structural breaches.',
    recommendedTeam: 'SRT-Hyderabad-Charlie (Standard First Responder)',
    recommendedHospital: 'City Municipal Hospital & Health Care',
    etaMinutes: 25,
    reportedBy: 'SIMULATION-DRILL-CHARLIE'
  },
  {
    id: 'SCENARIO-DELTA',
    title: 'Drill Delta: Severe Flash Flood Evacuation',
    category: 'FLOOD',
    severity: 'CRITICAL',
    peopleAffected: 24,
    location: { latitude: 17.3616, longitude: 78.4747 },
    locationName: 'Musi River Basin / Charminar Lowlands',
    description: 'Rapid water level rise inundating low-lying residential clusters. Multiple families stranded on rooftops.',
    recommendedTeam: 'DRT-Hyderabad-Delta (Disaster Rescue & Water SAR)',
    recommendedHospital: 'Osmania General Emergency Wing',
    etaMinutes: 12,
    reportedBy: 'SIMULATION-DRILL-DELTA'
  }
];

export const DEMO_RESPONSE_UNITS = [
  {
    id: 'ERT-HYD-01',
    name: 'ERT-Hyderabad-Alpha',
    type: 'Special Rapid Deployment',
    tier: 'Tier-1 Emergency Response',
    vehicle: 'Heavy Tactical Rescue & Trauma Rig',
    crewSize: 6,
    baseLocation: 'Central Fire & Rescue HQ, Hyderabad',
    latitude: 17.4065,
    longitude: 78.4772,
    status: 'STANDBY',
    specialties: ['High-Rise Extrication', 'Critical Triage', 'HazMat Containment']
  },
  {
    id: 'PRT-HYD-02',
    name: 'PRT-Hyderabad-Bravo',
    type: 'Priority Tactical Unit',
    tier: 'Tier-2 Priority Response',
    vehicle: 'Advanced Life Support (ALS) Ambulance Unit',
    crewSize: 4,
    baseLocation: 'West Sector Dispatch Depot, Banjara Hills',
    latitude: 17.4156,
    longitude: 78.4350,
    status: 'STANDBY',
    specialties: ['Mass Casualty Triage', 'Cardiac Resuscitation', 'Traffic Extrication']
  },
  {
    id: 'SRT-HYD-03',
    name: 'SRT-Hyderabad-Charlie',
    type: 'Standard First Responder',
    tier: 'Tier-3 Standard Response',
    vehicle: 'Rapid Patrol & First Aid Cruiser',
    crewSize: 3,
    baseLocation: 'Cyberabad Police Commissionerate Base',
    latitude: 17.4390,
    longitude: 78.3800,
    status: 'STANDBY',
    specialties: ['Perimeter Security', 'Basic Life Support', 'Hazard Mitigation']
  },
  {
    id: 'DRT-HYD-04',
    name: 'DRT-Hyderabad-Delta',
    type: 'Disaster Rescue Team',
    tier: 'Heavy Urban Search & Rescue',
    vehicle: 'Amphibious Inundation Rescue Vehicle',
    crewSize: 8,
    baseLocation: 'South Sector Water Rescue Depot',
    latitude: 17.3700,
    longitude: 78.4800,
    status: 'STANDBY',
    specialties: ['Flood Extraction', 'Structural Collapse SAR', 'Drone Reconnaissance']
  }
];

export const DEMO_HOSPITALS = [
  {
    id: 'HOSP-APOLLO',
    name: 'Apollo Emergency & Trauma Care, Hyderabad',
    tier: 'Level 1 Trauma Center',
    address: 'Road No. 72, Jubilee Hills, Hyderabad',
    latitude: 17.4260,
    longitude: 78.4120,
    emergencyBedsTotal: 50,
    emergencyBedsAvailable: 14,
    icuBedsAvailable: 6,
    bloodBankStatus: 'OPTIMAL',
    helipadAvailable: true,
    contact: '+91 40 2360 7777 (Simulated)'
  },
  {
    id: 'HOSP-KIMS',
    name: 'KIMS Regional Trauma Center, Hyderabad',
    tier: 'Level 2 Trauma Center',
    address: '1-8-31/1, Minister Road, Secunderabad',
    latitude: 17.4374,
    longitude: 78.4870,
    emergencyBedsTotal: 40,
    emergencyBedsAvailable: 9,
    icuBedsAvailable: 4,
    bloodBankStatus: 'ADEQUATE',
    helipadAvailable: false,
    contact: '+91 40 4488 5000 (Simulated)'
  },
  {
    id: 'HOSP-MUNICIPAL',
    name: 'City Municipal Hospital & Health Care',
    tier: 'Community Emergency Facility',
    address: 'Abids Road, Nampally, Hyderabad',
    latitude: 17.3912,
    longitude: 78.4735,
    emergencyBedsTotal: 30,
    emergencyBedsAvailable: 18,
    icuBedsAvailable: 2,
    bloodBankStatus: 'STANDBY',
    helipadAvailable: false,
    contact: '+91 40 2474 0123 (Simulated)'
  }
];
