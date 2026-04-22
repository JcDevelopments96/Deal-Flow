/* ============================================================================
   ADVANCED MARKET INTEL — the Market Intel view's top-level component.
   Holds the huge `marketData` atlas + state filter + recommendations +
   Top-5 rankings + the combined Map / Live Listings layout.
   ============================================================================ */
import React, { useState, useMemo, useCallback } from "react";
import {
  Search, MapPin, DollarSign, TrendingUp, Gauge, Target, Trophy,
  Filter, RotateCcw, X
} from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { Panel, CalcTooltip } from "../primitives.jsx";
import { USCountyMap } from "./USCountyMap.jsx";
import { LiveListingsPanel } from "./LiveListingsPanel.jsx";

const RepeatIcon = RotateCcw;

export const AdvancedMarketIntel = () => {
  const [selectedMetric, setSelectedMetric] = useState("capRate");
  const [investmentGoal, setInvestmentGoal] = useState("cashFlow");
  const [selectedState, setSelectedState] = useState("");
  const [showStateResults, setShowStateResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Bed / bath filters applied to Live Listings + Comparables
  const [bedsFilter, setBedsFilter] = useState("any");   // "any" | "1" | "2" | "3" | "4" | "5+"
  const [bathsFilter, setBathsFilter] = useState("any"); // "any" | "1" | "1.5" | "2" | "3" | "4+"

  const marketData = {
    northeast: {
      name: "Northeast",
      markets: [
        {
          city: "Buffalo", state: "NY", county: "Erie County",
          description: "Rust Belt city experiencing revitalization with strong university presence (UB) and growing tech sector. Affordable housing market with high rental demand.",
          medianPrice: 165000, medianRent: 1200, capRate: 9.8, rentGrowth: 10, inventory: 4.2, score: 85,
          brrrrScore: 78,
          brrrrFactors: { buy: 85, rehab: 75, rent: 80, refinance: 70, repeat: 80 },
          airbnb: {
            nightly: { min: 75, max: 120, avg: 95 },
            occupancy: { min: 55, max: 75, avg: 65 },
            monthlyRevenue: { min: 1500, max: 2300, avg: 1900 },
            competition: "Medium",
            adr: "$75-120",
            occupancyRange: "55-75%"
          },
          restrictions: {
            str: "Allowed", minStay: "2 nights", license: "Required",
            notes: "Registration required, safety inspections",
            details: "Host permit required through city. Annual license fee $150. Property inspection mandatory. Owner-occupied properties preferred."
          },
          dueDiligence: {
            keyFactors: [
              "Check neighborhood crime rates - varies significantly by area",
              "Verify property taxes - can be high in certain districts",
              "Snow load requirements for roof structures",
              "Lead paint disclosure for pre-1978 properties"
            ],
            marketRisks: ["Population decline in some areas", "Harsh winter weather impacts", "Property tax increases"],
            opportunities: ["University rental demand", "Downtown revitalization projects", "Proximity to Canada border"]
          },
          distressedProperties: {
            sources: [
              "Erie County Clerk's Office - foreclosure listings",
              "Buffalo Housing Court - code violation properties",
              "BiggerPockets Buffalo forums",
              "Local real estate agents specializing in distressed sales",
              "BUDC (Buffalo Urban Development Corporation) properties"
            ],
            bestAreas: ["Elmwood Village", "Allentown", "North Buffalo"],
            avoidAreas: ["East Buffalo", "Certain parts of West Side"]
          }
        },
        {
          city: "Rochester", state: "NY", county: "Monroe County",
          description: "Former industrial city transforming into tech hub with strong medical sector (University of Rochester). Affordable properties with solid rental demand.",
          medianPrice: 145000, medianRent: 1100, capRate: 10.1, rentGrowth: 11, inventory: 3.8, score: 88,
          brrrrScore: 82,
          brrrrFactors: { buy: 90, rehab: 80, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 65, max: 105, avg: 85 },
            occupancy: { min: 52, max: 72, avg: 62 },
            monthlyRevenue: { min: 1200, max: 2100, avg: 1650 },
            competition: "Low",
            adr: "$65-105",
            occupancyRange: "52-72%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Host permit required",
            details: "Simple registration process. $75 annual fee. Basic safety requirements. No caps on number of units."
          },
          dueDiligence: {
            keyFactors: [
              "Research neighborhood school districts",
              "Check for environmental issues near Kodak sites",
              "Verify heating systems for harsh winters",
              "Review flood zone maps near Genesee River"
            ],
            marketRisks: ["Economic dependence on major employers", "Seasonal tourism fluctuations", "Aging infrastructure"],
            opportunities: ["University of Rochester expansion", "Medical corridor growth", "Tech company relocations"]
          },
          distressedProperties: {
            sources: [
              "Monroe County foreclosure auctions",
              "Rochester City Hall - tax lien properties",
              "RHDC (Rochester Housing Development Corp)",
              "Local wholesalers network",
              "MLS distressed property filters"
            ],
            bestAreas: ["Park Avenue", "Monroe Village", "Corn Hill"],
            avoidAreas: ["Parts of northeast Rochester"]
          }
        },
        {
          city: "Syracuse", state: "NY", county: "Onondaga County",
          description: "College town with Syracuse University driving rental demand. Affordable market with strong cash flow potential and growing downtown area.",
          medianPrice: 135000, medianRent: 1050, capRate: 10.5, rentGrowth: 12, inventory: 4.5, score: 90,
          brrrrScore: 85,
          brrrrFactors: { buy: 95, rehab: 85, rent: 90, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 60, max: 100, avg: 80 },
            occupancy: { min: 48, max: 68, avg: 58 },
            monthlyRevenue: { min: 1100, max: 1800, avg: 1450 },
            competition: "Low",
            adr: "$60-100",
            occupancyRange: "48-68%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Optional",
            notes: "Minimal restrictions",
            details: "Very permissive regulations. No licensing required. Basic safety standards apply. Popular for Syracuse University events."
          },
          dueDiligence: {
            keyFactors: [
              "Proximity to Syracuse University for rental demand",
              "Snow removal requirements and costs",
              "Student housing regulations if targeting students",
              "Seasonal demand fluctuations"
            ],
            marketRisks: ["Heavy snow and weather damage", "Student-dependent areas can be volatile", "Limited job diversity beyond university"],
            opportunities: ["University growth and expansion", "Strong alumni network for STR demand", "Downtown revitalization projects"]
          },
          distressedProperties: {
            sources: [
              "Onondaga County tax sale lists",
              "Syracuse city code violation database",
              "University area landlord networks",
              "Local real estate investment groups",
              "Probate court listings"
            ],
            bestAreas: ["University Hill", "Downtown", "Westcott"],
            avoidAreas: ["South Side industrial areas"]
          }
        },
        {
          city: "Philadelphia", state: "PA", county: "Philadelphia County",
          description: "Major East Coast city with strong job market, universities, and tourism. Diverse neighborhoods with varying investment potential.",
          medianPrice: 195000, medianRent: 1450, capRate: 8.9, rentGrowth: 9, inventory: 3.2, score: 78,
          brrrrScore: 70,
          brrrrFactors: { buy: 75, rehab: 70, rent: 80, refinance: 65, repeat: 65 },
          airbnb: {
            nightly: { min: 100, max: 150, avg: 125 },
            occupancy: { min: 62, max: 82, avg: 72 },
            monthlyRevenue: { min: 2200, max: 3400, avg: 2800 },
            competition: "High",
            adr: "$100-150",
            occupancyRange: "62-82%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Primary residence only",
            details: "Highly regulated. Must be owner-occupied primary residence. 30-day minimum stay. $300 license fee."
          },
          dueDiligence: {
            keyFactors: ["Research zoning laws - very strict", "Check property tax assessment accuracy", "Verify rental licensing requirements", "Review neighborhood crime statistics"],
            marketRisks: ["Complex regulatory environment", "High property taxes", "Competitive rental market"],
            opportunities: ["Strong tourism and business travel", "Multiple universities nearby", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Philadelphia Sheriff's Office - foreclosure sales", "Philadelphia Land Bank properties", "Local real estate investment meetups", "MLS distressed listings", "Probate and estate sales"],
            bestAreas: ["Northern Liberties", "Fishtown", "Graduate Hospital"],
            avoidAreas: ["Certain North Philadelphia areas"]
          }
        },
        {
          city: "Pittsburgh", state: "PA", county: "Allegheny County",
          description: "Transformed steel city now tech hub with strong healthcare and education sectors. Affordable market with neighborhood-specific opportunities.",
          medianPrice: 145000, medianRent: 1150, capRate: 9.7, rentGrowth: 10, inventory: 3.9, score: 82,
          brrrrScore: 80,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 90, max: 130, avg: 110 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 1900, max: 2800, avg: 2350 },
            competition: "Medium",
            adr: "$90-130",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration & inspection required",
            details: "Moderate regulations. $50 annual registration. Safety inspection required."
          },
          dueDiligence: {
            keyFactors: ["Check hillside properties for foundation issues", "Verify parking availability requirements", "Research neighborhood gentrification trends", "Bridge and tunnel access considerations"],
            marketRisks: ["Topographical challenges for some properties", "Weather-related maintenance costs", "Economic dependence on major employers"],
            opportunities: ["Tech sector growth", "Strong healthcare and education", "Growing arts and culture scene"]
          },
          distressedProperties: {
            sources: ["Allegheny County Sheriff's sales", "Pittsburgh city tax lien sales", "Local real estate investment groups", "Renovation contractor networks", "Estate sale companies"],
            bestAreas: ["Lawrenceville", "Shadyside", "Oakland"],
            avoidAreas: ["Some outlying mill towns"]
          }
        },
        {
          city: "Newark", state: "NJ", county: "Essex County",
          description: "Gateway to NYC with major airport and transportation hub. Undergoing revitalization with new developments.",
          medianPrice: 285000, medianRent: 2100, capRate: 7.2, rentGrowth: 8, inventory: 2.8, score: 75,
          brrrrScore: 65,
          brrrrFactors: { buy: 70, rehab: 60, rent: 75, refinance: 60, repeat: 65 },
          airbnb: {
            nightly: { min: 115, max: 155, avg: 135 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 2700, max: 3700, avg: 3200 },
            competition: "High",
            adr: "$115-155",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Long-term rentals only",
            details: "30-day minimum stay enforced. Complex licensing process."
          },
          dueDiligence: {
            keyFactors: ["Research neighborhood safety improvements", "Check property tax trends", "Verify transportation access to NYC", "Review local development plans"],
            marketRisks: ["Crime rates in some areas", "Complex local regulations", "Competition from NYC market"],
            opportunities: ["Airport proximity for business travel", "NYC commuter demand", "Downtown revitalization projects"]
          },
          distressedProperties: {
            sources: ["Essex County Sheriff's sales", "Newark Housing Authority properties", "Local real estate investment networks", "Tax lien auction lists", "Commercial property brokers"],
            bestAreas: ["Downtown", "Ironbound District", "Forest Hill"],
            avoidAreas: ["Some South and West Ward areas"]
          }
        },
        {
          city: "Camden", state: "NJ", county: "Camden County",
          description: "Recovering post-industrial city with major revitalization efforts. Low entry prices but higher risk/reward profile.",
          medianPrice: 125000, medianRent: 1200, capRate: 11.5, rentGrowth: 11, inventory: 4.8, score: 89,
          brrrrScore: 85,
          brrrrFactors: { buy: 95, rehab: 80, rent: 85, refinance: 75, repeat: 90 },
          airbnb: {
            nightly: { min: 70, max: 110, avg: 90 },
            occupancy: { min: 45, max: 65, avg: 55 },
            monthlyRevenue: { min: 1200, max: 1900, avg: 1550 },
            competition: "Low",
            adr: "$70-110",
            occupancyRange: "45-65%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Optional",
            notes: "Few restrictions",
            details: "Very permissive regulations. No licensing required currently. Basic safety standards."
          },
          dueDiligence: {
            keyFactors: ["Research ongoing redevelopment projects", "Check neighborhood safety statistics", "Verify proximity to universities and hospitals", "Review flood zone maps near Delaware River"],
            marketRisks: ["Crime rates still above average", "Economic recovery still developing", "Limited amenities in some areas"],
            opportunities: ["Major redevelopment investments", "Cooper Medical School expansion", "Proximity to Philadelphia"]
          },
          distressedProperties: {
            sources: ["Camden Redevelopment Agency", "Camden County Sheriff's sales", "Cooper Foundation property programs", "Local church and nonprofit sales", "Wholesaler networks specializing in Camden"],
            bestAreas: ["Cooper Grant", "Cramer Hill", "Fairview"],
            avoidAreas: ["Some central Camden areas still recovering"]
          }
        }
      ]
    },
    southeast: {
      name: "Southeast",
      markets: [
        {
          city: "Orlando", state: "FL", county: "Orange County",
          description: "World's theme park capital with massive tourism industry. Strong STR market but high competition.",
          medianPrice: 320000, medianRent: 1850, capRate: 7.2, rentGrowth: 18, inventory: 2.1, score: 85,
          brrrrScore: 75,
          brrrrFactors: { buy: 70, rehab: 85, rent: 85, refinance: 70, repeat: 75 },
          airbnb: {
            nightly: { min: 140, max: 190, avg: 165 },
            occupancy: { min: 68, max: 88, avg: 78 },
            monthlyRevenue: { min: 3200, max: 4900, avg: 4050 },
            competition: "Very High",
            adr: "$140-190",
            occupancyRange: "68-88%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business tax receipt required. Zoning compliance mandatory."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to theme parks and attractions", "Check HOA restrictions on short-term rentals", "Verify hurricane insurance requirements", "Review vacation rental saturation in area"],
            marketRisks: ["Hurricane and weather damage", "Tourism industry volatility", "High competition in STR market"],
            opportunities: ["Year-round tourism demand", "Major corporate relocations", "International airport proximity"]
          },
          distressedProperties: {
            sources: ["Orange County Clerk's foreclosure auctions", "Orlando REO listings", "Local investor meetups and networks", "Wholesale property dealers", "Bank-owned property specialists"],
            bestAreas: ["Dr. Phillips", "Winter Park adjacent", "Tourist corridor properties"],
            avoidAreas: ["Some outlying Orange County areas"]
          }
        },
        {
          city: "Tampa", state: "FL", county: "Hillsborough County",
          description: "Major business and cultural center with growing downtown, universities, and sports teams.",
          medianPrice: 365000, medianRent: 2100, capRate: 6.8, rentGrowth: 14, inventory: 1.9, score: 82,
          brrrrScore: 78,
          brrrrFactors: { buy: 75, rehab: 85, rent: 85, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 130, max: 180, avg: 155 },
            occupancy: { min: 64, max: 84, avg: 74 },
            monthlyRevenue: { min: 2900, max: 4300, avg: 3600 },
            competition: "High",
            adr: "$130-180",
            occupancyRange: "64-84%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "License & safety inspection required",
            details: "Business license required. Annual inspection."
          },
          dueDiligence: {
            keyFactors: ["Check flood zone designations", "Research neighborhood development plans", "Verify parking and HOA requirements", "Review hurricane preparedness requirements"],
            marketRisks: ["Hurricane exposure", "Flood risk in some areas", "High property insurance costs"],
            opportunities: ["Major corporate headquarters", "University of South Florida growth", "Strong tourism and business travel"]
          },
          distressedProperties: {
            sources: ["Hillsborough County foreclosure sales", "Tampa Housing Authority properties", "Local real estate investor networks", "MLS distressed property searches", "Estate and probate sales"],
            bestAreas: ["Hyde Park", "Seminole Heights", "Westshore"],
            avoidAreas: ["Some East Tampa areas"]
          }
        },
        {
          city: "Jacksonville", state: "FL", county: "Duval County",
          description: "Major port city and financial center with growing population. Largest city by land area in US.",
          medianPrice: 295000, medianRent: 1750, capRate: 7.1, rentGrowth: 16, inventory: 2.8, score: 83,
          brrrrScore: 80,
          brrrrFactors: { buy: 80, rehab: 80, rent: 85, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 120, max: 170, avg: 145 },
            occupancy: { min: 61, max: 81, avg: 71 },
            monthlyRevenue: { min: 2700, max: 3700, avg: 3200 },
            competition: "High",
            adr: "$120-170",
            occupancyRange: "61-81%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license & inspection required",
            details: "Business tax receipt required. Zoning compliance mandatory."
          },
          dueDiligence: {
            keyFactors: ["Research specific Jacksonville neighborhoods", "Check military base proximity for rental demand", "Verify coastal insurance requirements", "Review transportation access downtown"],
            marketRisks: ["Hurricane and coastal storm damage", "Economic dependence on port/military", "Large geographic area with varying conditions"],
            opportunities: ["Growing population and job market", "Major port expansion projects", "Strong military rental demand"]
          },
          distressedProperties: {
            sources: ["Duval County Clerk foreclosure listings", "Jacksonville Sheriff's Office sales", "Local REI groups and meetups", "NFHP programs", "Military relocation specialists"],
            bestAreas: ["Riverside", "Avondale", "Atlantic Beach area"],
            avoidAreas: ["Some Northwest Jacksonville areas"]
          }
        },
        {
          city: "Miami", state: "FL", county: "Miami-Dade County",
          description: "International business and tourism hub with luxury market focus. High-end properties and strict STR regulations.",
          medianPrice: 485000, medianRent: 2800, capRate: 6.2, rentGrowth: 15, inventory: 2.5, score: 80,
          brrrrScore: 65,
          brrrrFactors: { buy: 60, rehab: 70, rent: 75, refinance: 65, repeat: 70 },
          airbnb: {
            nightly: { min: 165, max: 225, avg: 195 },
            occupancy: { min: 72, max: 92, avg: 82 },
            monthlyRevenue: { min: 4200, max: 5800, avg: 5000 },
            competition: "Very High",
            adr: "$165-225",
            occupancyRange: "72-92%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Highly regulated, minimum stay requirements",
            details: "30-day minimum strictly enforced. Complex licensing. High fees."
          },
          dueDiligence: {
            keyFactors: ["Verify condo association STR policies", "Check zoning for vacation rental compliance", "Research flood and hurricane insurance costs", "Review international buyer financing options"],
            marketRisks: ["Strict STR regulations", "Hurricane and flood exposure", "High cost of entry and operations"],
            opportunities: ["International tourism demand", "Strong luxury rental market", "Growing tech and finance sectors"]
          },
          distressedProperties: {
            sources: ["Miami-Dade County foreclosure auctions", "Luxury property liquidation sales", "International investor distress sales", "Bank REO specialists", "Condo association distressed units"],
            bestAreas: ["Brickell", "South Beach (limited STR)", "Coral Gables"],
            avoidAreas: ["Some areas with strict STR bans"]
          }
        },
        {
          city: "Fort Lauderdale", state: "FL", county: "Broward County",
          description: "Major cruise port and beach destination with year-round tourism.",
          medianPrice: 425000, medianRent: 2400, capRate: 6.5, rentGrowth: 13, inventory: 2.2, score: 79,
          brrrrScore: 72,
          brrrrFactors: { buy: 70, rehab: 80, rent: 85, refinance: 70, repeat: 75 },
          airbnb: {
            nightly: { min: 150, max: 200, avg: 175 },
            occupancy: { min: 68, max: 88, avg: 78 },
            monthlyRevenue: { min: 3600, max: 4900, avg: 4250 },
            competition: "Very High",
            adr: "$150-200",
            occupancyRange: "68-88%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Long-term only in most areas",
            details: "30-day minimum in residential zones. Business license required."
          },
          dueDiligence: {
            keyFactors: ["Check hurricane and flood zone designations", "Verify HOA STR restrictions", "Research tourism seasonal patterns", "Review parking requirements"],
            marketRisks: ["Hurricane exposure", "High competition", "Seasonal tourism fluctuations"],
            opportunities: ["Year-round tourism", "Business travel demand", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Broward County foreclosure auctions", "Cruise industry worker relocations", "Condo liquidation sales", "REO property specialists", "International investor distress sales"],
            bestAreas: ["Las Olas", "Victoria Park", "Colee Hammock"],
            avoidAreas: ["Some inland areas with lower tourism appeal"]
          }
        },
        {
          city: "West Palm Beach", state: "FL", county: "Palm Beach County",
          description: "Wealthy coastal city with strong business district and affluent retirees.",
          medianPrice: 395000, medianRent: 2200, capRate: 6.7, rentGrowth: 12, inventory: 2.4, score: 81,
          brrrrScore: 74,
          brrrrFactors: { buy: 72, rehab: 82, rent: 80, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 140, max: 185, avg: 165 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 3300, max: 4600, avg: 3950 },
            competition: "High",
            adr: "$140-185",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "License required, varies by district",
            details: "Business tax receipt required. Some historic districts have additional rules."
          },
          dueDiligence: {
            keyFactors: ["Research historic district regulations", "Check affluent neighborhood HOA rules", "Verify beach access rights", "Review seasonal rental patterns"],
            marketRisks: ["Hurricane and weather exposure", "Affluent buyer competition", "Seasonal demand fluctuations"],
            opportunities: ["Wealthy retiree market", "Business travel demand", "Cultural events and attractions"]
          },
          distressedProperties: {
            sources: ["Palm Beach County clerk sales", "Luxury property liquidations", "Estate sales and probate", "Country club area distress sales", "Senior downsizing sales"],
            bestAreas: ["Clematis Street area", "Flagler Drive", "El Cid neighborhood"],
            avoidAreas: ["Some areas too expensive for cash flow"]
          }
        },
        {
          city: "Pensacola", state: "FL", county: "Escambia County",
          description: "Military town with beautiful beaches and growing tourism.",
          medianPrice: 265000, medianRent: 1650, capRate: 7.8, rentGrowth: 14, inventory: 3.1, score: 86,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 80, repeat: 85 },
          airbnb: {
            nightly: { min: 110, max: 160, avg: 135 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 2200, max: 3400, avg: 2800 },
            competition: "Medium",
            adr: "$110-160",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required. Safety inspection."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to Naval Air Station", "Check hurricane preparedness requirements", "Verify beach access and restrictions", "Review military housing allowances"],
            marketRisks: ["Hurricane exposure", "Military base dependency", "Seasonal tourism patterns"],
            opportunities: ["Strong military rental demand", "Growing beach tourism", "Limited coastal supply"]
          },
          distressedProperties: {
            sources: ["Escambia County foreclosures", "Military relocation sales", "Hurricane damage properties", "Local real estate investor groups", "Beach property liquidations"],
            bestAreas: ["Downtown historic", "Near Naval base", "Beach corridor"],
            avoidAreas: ["Flood-prone inland areas"]
          }
        },
        {
          city: "Atlanta", state: "GA", county: "Fulton County",
          description: "Major Southeast business hub with diverse economy, major airport, and strong job growth.",
          medianPrice: 385000, medianRent: 2100, capRate: 6.5, rentGrowth: 11, inventory: 2.8, score: 80,
          brrrrScore: 75,
          brrrrFactors: { buy: 75, rehab: 80, rent: 80, refinance: 75, repeat: 70 },
          airbnb: {
            nightly: { min: 95, max: 145, avg: 120 },
            occupancy: { min: 62, max: 82, avg: 72 },
            monthlyRevenue: { min: 2100, max: 3200, avg: 2650 },
            competition: "High",
            adr: "$95-145",
            occupancyRange: "62-82%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required, varies by neighborhood",
            details: "Business license required. Some neighborhoods restrict STRs."
          },
          dueDiligence: {
            keyFactors: ["Research neighborhood STR regulations", "Check proximity to MARTA transit", "Verify property tax trends", "Review traffic and accessibility"],
            marketRisks: ["Traffic congestion", "Neighborhood regulation changes", "High competition"],
            opportunities: ["Airport business travel", "Major corporate presence", "Convention and event demand"]
          },
          distressedProperties: {
            sources: ["Fulton County Sheriff's sales", "Atlanta foreclosure auctions", "Corporate relocation sales", "Major real estate investor networks", "Gentrification opportunity areas"],
            bestAreas: ["Intown neighborhoods", "Near MARTA lines", "Midtown area"],
            avoidAreas: ["Some far suburban areas"]
          }
        },
        {
          city: "Charlotte", state: "NC", county: "Mecklenburg County",
          description: "Major banking center with rapidly growing population. Strong job market and diverse economy.",
          medianPrice: 345000, medianRent: 1850, capRate: 6.4, rentGrowth: 13, inventory: 2.6, score: 82,
          brrrrScore: 78,
          brrrrFactors: { buy: 78, rehab: 85, rent: 85, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 85, max: 125, avg: 105 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 1800, max: 2700, avg: 2250 },
            competition: "Medium",
            adr: "$85-125",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required. Zoning compliance."
          },
          dueDiligence: {
            keyFactors: ["Research rapid development areas", "Check HOA short-term rental policies", "Verify school district quality for families", "Review transportation access"],
            marketRisks: ["Rapid price appreciation", "Development oversupply risk", "Competition from new builds"],
            opportunities: ["Strong job growth", "Major banking sector", "University presence"]
          },
          distressedProperties: {
            sources: ["Mecklenburg County foreclosures", "Banking industry relocations", "Developer distress sales", "Local real estate investor meetups", "Corporate housing liquidations"],
            bestAreas: ["South End", "NoDa", "University area"],
            avoidAreas: ["Some outer suburban developments"]
          }
        },
        {
          city: "Nashville", state: "TN", county: "Davidson County",
          description: "Music City with booming tourism, growing tech sector, and strong job market.",
          medianPrice: 425000, medianRent: 2000, capRate: 5.6, rentGrowth: 15, inventory: 2.1, score: 84,
          brrrrScore: 80,
          brrrrFactors: { buy: 75, rehab: 85, rent: 90, refinance: 75, repeat: 85 },
          airbnb: {
            nightly: { min: 110, max: 160, avg: 135 },
            occupancy: { min: 68, max: 88, avg: 78 },
            monthlyRevenue: { min: 2700, max: 4100, avg: 3400 },
            competition: "Very High",
            adr: "$110-160",
            occupancyRange: "68-88%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Permit required, limit per neighborhood",
            details: "STRP permit required ($150). Neighborhood caps on permits."
          },
          dueDiligence: {
            keyFactors: ["Check STRP permit availability in area", "Research music venue proximity", "Verify parking requirements", "Review event calendar impact"],
            marketRisks: ["Permit availability", "Noise complaints", "High competition", "Regulatory changes"],
            opportunities: ["Year-round music tourism", "Growing tech sector", "Major event demand"]
          },
          distressedProperties: {
            sources: ["Davidson County foreclosures", "Music industry worker relocations", "Developer overextension sales", "Local investor networks", "Entertainment district properties"],
            bestAreas: ["Music Row area", "The Gulch", "East Nashville"],
            avoidAreas: ["Some areas too expensive for cash flow"]
          }
        }
      ]
    },
    midwest: {
      name: "Midwest",
      markets: [
        {
          city: "Columbus", state: "OH", county: "Franklin County",
          description: "State capital with Ohio State University, diverse economy including tech, healthcare, and government.",
          medianPrice: 215000, medianRent: 1400, capRate: 7.8, rentGrowth: 11, inventory: 3.2, score: 84,
          brrrrScore: 85,
          brrrrFactors: { buy: 85, rehab: 85, rent: 90, refinance: 80, repeat: 80 },
          airbnb: {
            nightly: { min: 105, max: 145, avg: 125 },
            occupancy: { min: 60, max: 80, avg: 70 },
            monthlyRevenue: { min: 2200, max: 3200, avg: 2750 },
            competition: "Medium",
            adr: "$105-145",
            occupancyRange: "60-80%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business license required ($25). Basic safety requirements."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to Ohio State University", "Check neighborhood development plans", "Verify winter heating costs", "Review local job market trends"],
            marketRisks: ["Cold weather maintenance", "Student housing competition", "Economic dependence on state government"],
            opportunities: ["University rental demand", "State government stability", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Franklin County Sheriff's sales", "Columbus city tax lien sales", "University area landlord networks", "Ohio real estate investor groups", "Student housing conversions"],
            bestAreas: ["Short North", "German Village", "University District"],
            avoidAreas: ["Some far east suburban areas"]
          }
        },
        {
          city: "Cleveland", state: "OH", county: "Cuyahoga County",
          description: "Major Great Lakes city undergoing revitalization with strong healthcare sector and cultural attractions.",
          medianPrice: 155000, medianRent: 1200, capRate: 9.3, rentGrowth: 12, inventory: 4.1, score: 87,
          brrrrScore: 88,
          brrrrFactors: { buy: 95, rehab: 85, rent: 85, refinance: 85, repeat: 85 },
          airbnb: {
            nightly: { min: 85, max: 125, avg: 105 },
            occupancy: { min: 55, max: 75, avg: 65 },
            monthlyRevenue: { min: 1600, max: 2600, avg: 2100 },
            competition: "Low",
            adr: "$85-125",
            occupancyRange: "55-75%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required ($100). Fire safety inspection."
          },
          dueDiligence: {
            keyFactors: ["Research neighborhood safety and development", "Check Cleveland Clinic proximity for demand", "Verify winter maintenance requirements", "Review lake effect snow considerations"],
            marketRisks: ["Harsh winter weather", "Population decline in some areas", "Economic transition challenges"],
            opportunities: ["Healthcare sector growth", "Downtown revitalization", "Cultural attractions tourism"]
          },
          distressedProperties: {
            sources: ["Cuyahoga County foreclosures", "Cleveland Land Bank properties", "Healthcare worker relocations", "Industrial area redevelopment", "Local wholesaler networks"],
            bestAreas: ["Ohio City", "Tremont", "University Circle"],
            avoidAreas: ["Some East Side areas still declining"]
          }
        },
        {
          city: "Cincinnati", state: "OH", county: "Hamilton County",
          description: "Historic riverfront city with strong corporate presence and growing downtown.",
          medianPrice: 185000, medianRent: 1300, capRate: 8.4, rentGrowth: 10, inventory: 3.7, score: 83,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 80, repeat: 80 },
          airbnb: {
            nightly: { min: 90, max: 130, avg: 110 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 1800, max: 2800, avg: 2300 },
            competition: "Medium",
            adr: "$90-130",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required. Historic districts may have additional rules."
          },
          dueDiligence: {
            keyFactors: ["Research historic district regulations", "Check flood zone designations near river", "Verify neighborhood gentrification trends", "Review corporate job market stability"],
            marketRisks: ["Flood risk near river", "Economic dependence on major employers", "Competition from suburban areas"],
            opportunities: ["Downtown revitalization", "Corporate headquarters demand", "Historic charm appeal"]
          },
          distressedProperties: {
            sources: ["Hamilton County Sheriff's sales", "Cincinnati city foreclosures", "Historic renovation opportunities", "Corporate relocation sales", "Riverfront redevelopment"],
            bestAreas: ["Over-the-Rhine", "Mount Adams", "Downtown"],
            avoidAreas: ["Some flood-prone riverfront areas"]
          }
        },
        {
          city: "Detroit", state: "MI", county: "Wayne County",
          description: "Recovering industrial city with major revitalization efforts downtown. Extremely affordable with high risk/reward potential.",
          medianPrice: 85000, medianRent: 750, capRate: 10.6, rentGrowth: 12, inventory: 6.8, score: 91,
          brrrrScore: 85,
          brrrrFactors: { buy: 98, rehab: 75, rent: 80, refinance: 75, repeat: 95 },
          airbnb: {
            nightly: { min: 55, max: 85, avg: 65 },
            occupancy: { min: 42, max: 62, avg: 52 },
            monthlyRevenue: { min: 800, max: 1300, avg: 1050 },
            competition: "Low",
            adr: "$55-85",
            occupancyRange: "42-62%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Optional",
            notes: "Revitalizing area, few restrictions",
            details: "Very permissive regulations. City encourages investment."
          },
          dueDiligence: {
            keyFactors: ["Research specific neighborhood recovery status", "Check proximity to downtown revival areas", "Verify property tax payment history", "Review crime statistics by block"],
            marketRisks: ["Neighborhood quality varies dramatically", "Infrastructure challenges", "Property tax issues"],
            opportunities: ["Massive appreciation potential", "Downtown revival spillover", "Rock-bottom entry prices"]
          },
          distressedProperties: {
            sources: ["Wayne County tax foreclosures", "Detroit Land Bank Authority", "Automotive worker relocations", "Downtown revitalization spillover", "Community development programs"],
            bestAreas: ["Downtown", "Midtown", "Corktown"],
            avoidAreas: ["Research each area carefully - quality varies by block"]
          }
        },
        {
          city: "Indianapolis", state: "IN", county: "Marion County",
          description: "State capital with diverse economy, major sports venues, and strong job market.",
          medianPrice: 185000, medianRent: 1200, capRate: 7.8, rentGrowth: 10, inventory: 3.6, score: 83,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 85, rent: 85, refinance: 80, repeat: 75 },
          airbnb: {
            nightly: { min: 85, max: 120, avg: 100 },
            occupancy: { min: 55, max: 75, avg: 65 },
            monthlyRevenue: { min: 1600, max: 2400, avg: 2000 },
            competition: "Medium",
            adr: "$85-120",
            occupancyRange: "55-75%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business license required. Indianapolis 500 and sports events drive major demand spikes."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to downtown and sports venues", "Check state government job stability", "Verify racing event rental potential", "Review neighborhood development plans"],
            marketRisks: ["Economic dependence on government/sports", "Weather maintenance costs", "Competition from suburban areas"],
            opportunities: ["Indianapolis 500 and sports events", "State government stability", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Marion County Sheriff's sales", "Indianapolis foreclosure auctions", "Government worker relocations", "Sports venue area properties", "Local real estate investor networks"],
            bestAreas: ["Mass Ave", "Fountain Square", "Broad Ripple"],
            avoidAreas: ["Some far west side areas"]
          }
        },
        {
          city: "Chicago", state: "IL", county: "Cook County",
          description: "Major international city with diverse economy, world-class attractions, and complex regulatory environment.",
          medianPrice: 485000, medianRent: 2400, capRate: 5.9, rentGrowth: 8, inventory: 2.1, score: 77,
          brrrrScore: 68,
          brrrrFactors: { buy: 60, rehab: 65, rent: 80, refinance: 70, repeat: 65 },
          airbnb: {
            nightly: { min: 130, max: 180, avg: 155 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 3000, max: 4300, avg: 3650 },
            competition: "Very High",
            adr: "$130-180",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Restricted", minStay: "1 night", license: "Required",
            notes: "Complex regulations, varies by ward",
            details: "Complex licensing by ward. Some areas prohibit STRs."
          },
          dueDiligence: {
            keyFactors: ["Research ward-specific STR regulations", "Check property tax trends", "Verify transportation access", "Review crime statistics by area"],
            marketRisks: ["Complex regulatory environment", "High property taxes", "Crime in some areas"],
            opportunities: ["Major tourism and business travel", "World-class attractions", "Transportation hub"]
          },
          distressedProperties: {
            sources: ["Cook County foreclosure auctions", "Chicago city tax sales", "Corporate relocation liquidations", "Condo conversion opportunities", "Luxury market distress sales"],
            bestAreas: ["Lincoln Park", "River North", "Gold Coast"],
            avoidAreas: ["Some South and West Side areas"]
          }
        }
      ]
    },
    southwest: {
      name: "Southwest",
      markets: [
        {
          city: "Phoenix", state: "AZ", county: "Maricopa County",
          description: "Major desert metropolis with year-round sunshine, growing tech sector, and strong retiree migration.",
          medianPrice: 415000, medianRent: 2200, capRate: 6.4, rentGrowth: 16, inventory: 2.1, score: 79,
          brrrrScore: 75,
          brrrrFactors: { buy: 70, rehab: 80, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 155, max: 195, avg: 175 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 3400, max: 4800, avg: 4100 },
            competition: "High",
            adr: "$155-195",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license and tax ID required",
            details: "Business license required. Transient occupancy tax."
          },
          dueDiligence: {
            keyFactors: ["Research extreme heat summer impacts", "Check HOA short-term rental policies", "Verify pool maintenance and liability", "Review seasonal demand patterns"],
            marketRisks: ["Extreme summer heat reduces demand", "High competition from hotels/resorts", "Water usage restrictions"],
            opportunities: ["Year-round tourism", "Major retiree destination", "Growing tech and healthcare sectors"]
          },
          distressedProperties: {
            sources: ["Maricopa County foreclosure auctions", "Retiree downsizing sales", "Seasonal property liquidations", "Resort area distressed sales", "Local real estate investor networks"],
            bestAreas: ["Scottsdale adjacent", "Central Phoenix", "Tempe area"],
            avoidAreas: ["Some far suburban developments"]
          }
        },
        {
          city: "Dallas", state: "TX", county: "Dallas County",
          description: "Major business hub with diverse economy, no state income tax, and strong job growth.",
          medianPrice: 285000, medianRent: 1700, capRate: 7.1, rentGrowth: 13, inventory: 2.6, score: 82,
          brrrrScore: 80,
          brrrrFactors: { buy: 80, rehab: 85, rent: 85, refinance: 80, repeat: 75 },
          airbnb: {
            nightly: { min: 115, max: 155, avg: 135 },
            occupancy: { min: 61, max: 81, avg: 71 },
            monthlyRevenue: { min: 2400, max: 3600, avg: 3000 },
            competition: "Medium",
            adr: "$115-155",
            occupancyRange: "61-81%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business license required. Hotel occupancy tax."
          },
          dueDiligence: {
            keyFactors: ["Research specific Dallas neighborhood regulations", "Check proximity to business districts", "Verify airport flight path noise", "Review corporate travel patterns"],
            marketRisks: ["Economic dependence on oil/energy sector", "Hot summer weather", "Competition from business hotels"],
            opportunities: ["Major corporate presence", "DFW airport business travel", "No state income tax"]
          },
          distressedProperties: {
            sources: ["Dallas County foreclosure auctions", "Corporate relocation sales", "Energy sector worker relocations", "Local real estate investment groups", "Commercial property conversions"],
            bestAreas: ["Deep Ellum", "Bishop Arts District", "Uptown Dallas"],
            avoidAreas: ["Some far suburban areas with long commutes"]
          }
        },
        {
          city: "Austin", state: "TX", county: "Travis County",
          description: "Tech hub and capital city with major university, live music scene.",
          medianPrice: 485000, medianRent: 2600, capRate: 6.4, rentGrowth: 14, inventory: 1.8, score: 76,
          brrrrScore: 70,
          brrrrFactors: { buy: 65, rehab: 75, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 165, max: 205, avg: 185 },
            occupancy: { min: 67, max: 87, avg: 77 },
            monthlyRevenue: { min: 3800, max: 5100, avg: 4450 },
            competition: "Very High",
            adr: "$165-205",
            occupancyRange: "67-87%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Type 2 license required, highly regulated",
            details: "30-day minimum in most residential areas. Type 2 license required ($271)."
          },
          dueDiligence: {
            keyFactors: ["Research Austin's complex STR zoning laws", "Check Type 2 license availability", "Verify music venue proximity", "Review major event calendar impact"],
            marketRisks: ["Restrictive STR regulations", "High property prices", "University student competition"],
            opportunities: ["Major tech sector growth", "SXSW and music events", "University of Texas demand"]
          },
          distressedProperties: {
            sources: ["Travis County foreclosure sales", "Tech worker relocations", "Music venue area properties", "University area investments", "SXSW event-driven opportunities"],
            bestAreas: ["East Austin", "South Austin", "Downtown areas"],
            avoidAreas: ["Areas with strict STR bans"]
          }
        },
        {
          city: "Denver", state: "CO", county: "Denver County",
          description: "Mile High City with outdoor recreation focus, growing cannabis industry, and major airport hub.",
          medianPrice: 495000, medianRent: 2600, capRate: 6.3, rentGrowth: 13, inventory: 1.9, score: 76,
          brrrrScore: 72,
          brrrrFactors: { buy: 65, rehab: 75, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 165, max: 205, avg: 185 },
            occupancy: { min: 64, max: 84, avg: 74 },
            monthlyRevenue: { min: 3600, max: 4990, avg: 4295 },
            competition: "Very High",
            adr: "$165-205",
            occupancyRange: "64-84%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "License and inspection required",
            details: "Primary residence requirement for some licenses."
          },
          dueDiligence: {
            keyFactors: ["Research Denver's primary residence requirements", "Check altitude and weather impacts", "Verify proximity to ski areas", "Review cannabis tourism regulations"],
            marketRisks: ["High altitude construction challenges", "Seasonal tourism fluctuations", "Complex licensing requirements"],
            opportunities: ["Outdoor recreation tourism", "Growing tech sector", "Cannabis industry growth"]
          },
          distressedProperties: {
            sources: ["Denver County foreclosure auctions", "Tech worker relocations", "Cannabis industry properties", "Outdoor recreation area sales", "Ski tourism related distress"],
            bestAreas: ["RiNo", "Highlands", "Cap Hill"],
            avoidAreas: ["Some industrial areas still transitioning"]
          }
        },
        {
          city: "Houston", state: "TX", county: "Harris County",
          description: "Energy capital with major port, diverse economy, and no zoning laws.",
          medianPrice: 235000, medianRent: 1500, capRate: 7.7, rentGrowth: 11, inventory: 3.2, score: 83,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 80, repeat: 80 },
          airbnb: {
            nightly: { min: 100, max: 140, avg: 120 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 2100, max: 3000, avg: 2550 },
            competition: "Medium",
            adr: "$100-140",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license and permit required",
            details: "Business license required. Hotel occupancy tax."
          },
          dueDiligence: {
            keyFactors: ["Research flood zone designations carefully", "Check energy sector job stability", "Verify hurricane preparedness", "Review medical center proximity"],
            marketRisks: ["Flood and hurricane exposure", "Oil price volatility", "Hurricane/weather damage"],
            opportunities: ["Major energy sector", "Medical center demand", "Port and international business"]
          },
          distressedProperties: {
            sources: ["Harris County foreclosure sales", "Energy sector worker relocations", "Hurricane damage properties", "Medical center area investments", "International business relocations"],
            bestAreas: ["Medical Center area", "Heights", "Montrose"],
            avoidAreas: ["High flood risk zones"]
          }
        }
      ]
    }
  };

  // CRITICAL: allMarkets must be defined BEFORE anything that references it
  const allMarkets = useMemo(() => {
    return Object.values(marketData).flatMap(region => region.markets);
  }, []);

  const availableStates = useMemo(() => {
    const states = [...new Set(allMarkets.map(m => m.state))].sort();
    return states;
  }, [allMarkets]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const results = allMarkets.filter(market => {
      return market.city.toLowerCase().includes(query) ||
             market.state.toLowerCase().includes(query) ||
             (market.county && market.county.toLowerCase().includes(query));
    });
    return results.slice(0, 8);
  }, [searchQuery, allMarkets]);

  const isStateSearch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    const stateMatches = availableStates.filter(state => state.toLowerCase() === query);
    return stateMatches.length > 0;
  }, [searchQuery, availableStates]);

  const getStateInfo = (stateCode) => {
    const stateNames = {
      FL: "Florida", OH: "Ohio", TX: "Texas", NY: "New York",
      PA: "Pennsylvania", NJ: "New Jersey", GA: "Georgia",
      NC: "North Carolina", SC: "South Carolina", TN: "Tennessee",
      MI: "Michigan", IN: "Indiana", IL: "Illinois",
      AZ: "Arizona", CO: "Colorado"
    };
    const cityCount = allMarkets.filter(m => m.state === stateCode).length;
    return { name: stateNames[stateCode] || stateCode, cityCount };
  };

  const getStateMarkets = (stateCode) => {
    return allMarkets.filter(market => market.state === stateCode);
  };

  const handleStateChange = (stateCode) => {
    setSelectedState(stateCode);
    setShowStateResults(!!stateCode);
    if (stateCode) {
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const clearStateSelection = () => {
    setSelectedState("");
    setShowStateResults(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSearchResults(!!value.trim());
    if (value.trim()) {
      setSelectedState("");
      setShowStateResults(false);
    }
  };

  const getTopMarkets = (metric, count = 5) => {
    return [...allMarkets]
      .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
      .slice(0, count);
  };

  const getRecommendedMarkets = (goal) => {
    const goalMap = {
      cashFlow: "capRate",
      appreciation: "rentGrowth",
      brrrr: "brrrrScore",
      balanced: "score"
    };
    return getTopMarkets(goalMap[goal] || "score", 3);
  };

  const recommendedMarkets = getRecommendedMarkets(investmentGoal);
  const topMarkets = getTopMarkets(selectedMetric, 5);
  const stateMarkets = selectedState ? getStateMarkets(selectedState) : [];
  const stateInfo = selectedState ? getStateInfo(selectedState) : null;

  // Map-derived focus: state selection > single search match > full US
  const mapFocusState = useMemo(() => {
    if (selectedState) return selectedState;
    if (searchResults.length === 1) return searchResults[0].state;
    return null;
  }, [selectedState, searchResults]);

  // Map highlight: single search match gets the bright pin; state browsing shows all state counties
  const mapHighlight = useMemo(() => {
    if (searchResults.length === 1) return searchResults[0];
    return null;
  }, [searchResults]);

  // Clicking any county on the map drives the search / live listings flow.
  // Tracked markets use the existing search path; un-tracked counties fall through
  // to the state selection so the LiveListingsPanel can query that county directly.
  const [clickedArea, setClickedArea] = useState(null);

  const handleMapCountyClick = useCallback((payload) => {
    if (!payload) return;
    if (payload.synthetic) {
      // Non-tracked county: surface it as the state + county for live data queries
      setSelectedState(payload.state);
      setShowStateResults(true);
      setSearchQuery("");
      setShowSearchResults(false);
      setClickedArea({ state: payload.state, city: payload.city, county: payload.county });
    } else {
      setSearchQuery(payload.city);
      setShowSearchResults(true);
      setSelectedState("");
      setShowStateResults(false);
      setClickedArea({ state: payload.state, city: payload.city, county: payload.county });
    }
  }, []);

  const renderMarketCard = (market, showRank = false, rank = 0) => (
    <div
      key={`${market.city}-${market.state}`}
      style={{
        padding: 16,
        border: `1px solid ${THEME.border}`,
        borderRadius: 8,
        background: THEME.bgPanel,
        marginBottom: 12
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {showRank && (
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: THEME.accent, color: THEME.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700
              }}>
                {rank}
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {market.city}, {market.state}
            </div>
          </div>
          {market.county && (
            <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>
              {market.county}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: THEME.textMuted }}>Deal Score</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: THEME.accent }}>
            {market.brrrrScore || market.score}
          </div>
        </div>
      </div>

      {market.description && (
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
          {market.description}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>MEDIAN</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtUSD(market.medianPrice, { short: true })}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>RENT</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>${market.medianRent}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>CAP RATE</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.green }}>{market.capRate}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>GROWTH</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.secondary }}>+{market.rentGrowth}%</div>
        </div>
      </div>

      {market.airbnb && (
        <div style={{
          padding: 10, background: THEME.bgRaised, borderRadius: 6,
          marginBottom: 10, fontSize: 12
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: THEME.textMuted }}>STR Nightly</span>
            <span style={{ fontWeight: 600 }}>{market.airbnb.adr || `$${market.airbnb.nightly?.avg || 0}`}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: THEME.textMuted }}>Occupancy</span>
            <span style={{ fontWeight: 600 }}>{market.airbnb.occupancyRange || `${market.airbnb.occupancy?.avg || 0}%`}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: THEME.textMuted }}>Competition</span>
            <span style={{ fontWeight: 600 }}>{market.airbnb.competition}</span>
          </div>
        </div>
      )}

      {market.restrictions && (
        <div style={{ fontSize: 11, color: THEME.textMuted, padding: "6px 0", borderTop: `1px solid ${THEME.borderLight}` }}>
          <strong>STR:</strong> {market.restrictions.str} | <strong>Min Stay:</strong> {market.restrictions.minStay} | <strong>License:</strong> {market.restrictions.license}
        </div>
      )}

      {market.dueDiligence && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.accent, marginBottom: 4 }}>Key Due Diligence</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: THEME.textMuted }}>
            {market.dueDiligence.keyFactors.slice(0, 2).map((factor, idx) => (
              <li key={idx} style={{ marginBottom: 2 }}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // City drill-down: clicked area wins over search / state defaults
  const liveListingsCity = useMemo(() => {
    if (clickedArea && clickedArea.city) return clickedArea.city;
    if (searchResults.length === 1) return searchResults[0].city;
    if (selectedState && stateMarkets.length > 0) return stateMarkets[0].city;
    return null;
  }, [clickedArea, searchResults, selectedState, stateMarkets]);

  const liveListingsStateMarkets = useMemo(() => {
    if (selectedState) return stateMarkets;
    if (clickedArea && clickedArea.state) return allMarkets.filter(m => m.state === clickedArea.state);
    if (searchResults.length === 1) return allMarkets.filter(m => m.state === searchResults[0].state);
    return [];
  }, [selectedState, stateMarkets, clickedArea, searchResults, allMarkets]);

  const liveListingsState =
    selectedState ||
    (clickedArea && clickedArea.state) ||
    (searchResults.length === 1 ? searchResults[0].state : "");

  return (
    <div>
      {/* 1. STATE FILTER — first thing the user sees */}
      <Panel title="Filter by State" icon={<Filter size={16} />} accent style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
          Start by picking a state to narrow the map, then browse the live listings and comparables for that area.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 3fr", gap: 16 }}>
          <div>
            <div className="label-xs" style={{ marginBottom: 8 }}>Browse by State</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", fontSize: 14 }}
              >
                <option value="">Select a state...</option>
                {availableStates.map(state => {
                  const info = getStateInfo(state);
                  return (
                    <option key={state} value={state}>
                      {info.name} ({info.cityCount} {info.cityCount === 1 ? "city" : "cities"})
                    </option>
                  );
                })}
              </select>
              {selectedState && (
                <button
                  onClick={clearStateSelection}
                  className="btn-ghost"
                  style={{ padding: "8px 12px", fontSize: 12 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="label-xs" style={{ marginBottom: 8 }}>Or search by city / county</div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by city, state, or county (e.g. Columbus, OH, Tampa)"
                style={{
                  width: "100%", padding: "10px 36px 10px 12px", fontSize: 14,
                  border: `1px solid ${THEME.border}`, borderRadius: 6
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: "absolute", right: 8, top: "50%",
                    transform: "translateY(-50%)", background: "transparent",
                    color: THEME.textMuted, padding: 4
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: THEME.textDim, marginBottom: 6 }}>Quick picks</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["FL", "OH", "TX", "Columbus OH", "Tampa FL", "Detroit MI", "Memphis TN"].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleSearchChange(suggestion)}
                style={{
                  padding: "4px 10px", fontSize: 11,
                  background: THEME.bg, border: `1px solid ${THEME.border}`,
                  borderRadius: 12, color: THEME.textMuted, cursor: "pointer"
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Bed / Bath filters — applied to Live Listings & Comparables below */}
        <div style={{
          marginTop: 16,
          padding: 12,
          background: THEME.bg,
          border: `1px solid ${THEME.border}`,
          borderRadius: 6,
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr",
          gap: 14
        }}>
          <div>
            <div className="label-xs" style={{ marginBottom: 6, display: "inline-flex", alignItems: "center" }}>
              Bedrooms
              <CalcTooltip
                size={12}
                title="Bedrooms Filter"
                description="Filters listings by bedroom count. '5+' means five or more."
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["any", "1", "2", "3", "4", "5+"].map(opt => (
                <button
                  key={opt}
                  onClick={() => setBedsFilter(opt)}
                  style={{
                    padding: "5px 12px", fontSize: 12, fontWeight: 600,
                    background: bedsFilter === opt ? THEME.accent : THEME.bg,
                    color: bedsFilter === opt ? "#fff" : THEME.textMuted,
                    border: `1px solid ${bedsFilter === opt ? THEME.accent : THEME.border}`,
                    borderRadius: 14, cursor: "pointer", minWidth: 44
                  }}
                >
                  {opt === "any" ? "Any" : opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label-xs" style={{ marginBottom: 6, display: "inline-flex", alignItems: "center" }}>
              Bathrooms
              <CalcTooltip
                size={12}
                title="Bathrooms Filter"
                description="Filters listings by bathroom count. '4+' means four or more."
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["any", "1", "1.5", "2", "3", "4+"].map(opt => (
                <button
                  key={opt}
                  onClick={() => setBathsFilter(opt)}
                  style={{
                    padding: "5px 12px", fontSize: 12, fontWeight: 600,
                    background: bathsFilter === opt ? THEME.teal : THEME.bg,
                    color: bathsFilter === opt ? "#fff" : THEME.textMuted,
                    border: `1px solid ${bathsFilter === opt ? THEME.teal : THEME.border}`,
                    borderRadius: 14, cursor: "pointer", minWidth: 44
                  }}
                >
                  {opt === "any" ? "Any" : opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* 2 + 3. MAP (left) + LIVE LISTINGS (right) side-by-side once a state is active.
              Map is sticky so it stays in view while the listings column scrolls. */}
      {liveListingsState ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr" : "minmax(420px, 1fr) minmax(380px, 1fr)",
          gap: 20,
          alignItems: "start",
          marginBottom: 24
        }}>
          <div style={{ position: isMobile() ? "static" : "sticky", top: 16 }}>
            <Panel title="Market Map — US Counties" icon={<MapPin size={16} />} accent>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
                Click any county to load listings for that area on the right.
              </div>
              <USCountyMap
                allMarkets={allMarkets}
                selectedState={mapFocusState}
                highlightedMarket={mapHighlight}
                onCountyClick={handleMapCountyClick}
              />
            </Panel>
          </div>
          <div>
            <LiveListingsPanel
              selectedState={liveListingsState}
              selectedCity={liveListingsCity}
              stateName={stateInfo ? stateInfo.name : null}
              stateMarkets={liveListingsStateMarkets}
              bedsFilter={bedsFilter}
              bathsFilter={bathsFilter}
            />
          </div>
        </div>
      ) : (
        <Panel title="Market Map — US Counties" icon={<MapPin size={16} />} accent style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
            Every tracked market, color-coded by overall deal score on a red-yellow-green heatmap. Red indicates weaker markets, yellow is average, and green represents the strongest investment conditions. Click a county to drill in — listings for that area will load alongside the map.
          </div>
          <USCountyMap
            allMarkets={allMarkets}
            selectedState={mapFocusState}
            highlightedMarket={mapHighlight}
            onCountyClick={handleMapCountyClick}
          />
        </Panel>
      )}

      {/* 4. SEARCH / STATE RESULT CARDS */}
      {showSearchResults && searchResults.length > 0 && (
        <Panel title={`Search Results (${searchResults.length})`} icon={<Search size={16} />} style={{ marginBottom: 24 }}>
          {searchResults.map(market => renderMarketCard(market))}
        </Panel>
      )}

      {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
        <Panel title="Search Results" icon={<Search size={16} />} style={{ marginBottom: 24 }}>
          <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
            No markets found matching "{searchQuery}". Try a city or state name.
          </div>
        </Panel>
      )}

      {showStateResults && stateInfo && (
        <Panel title={`${stateInfo.name} Markets (${stateInfo.cityCount})`} icon={<MapPin size={16} />} style={{ marginBottom: 24 }}>
          {stateMarkets.map(market => renderMarketCard(market))}
        </Panel>
      )}

      {/* 5. GOAL & RECOMMENDATIONS */}
      <Panel title="Investment Goal & Recommendations" icon={<Target size={16} />} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div className="label-xs" style={{ marginBottom: 10 }}>What's your primary investment goal?</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
            {[
              { key: "cashFlow", label: "Cash Flow", icon: <DollarSign size={16} /> },
              { key: "appreciation", label: "Appreciation", icon: <TrendingUp size={16} /> },
              { key: "brrrr", label: "BRRRR", icon: <RepeatIcon size={16} /> },
              { key: "balanced", label: "Balanced", icon: <Gauge size={16} /> }
            ].map(goal => (
              <button
                key={goal.key}
                onClick={() => setInvestmentGoal(goal.key)}
                style={{
                  padding: 12,
                  border: `2px solid ${investmentGoal === goal.key ? THEME.accent : THEME.border}`,
                  borderRadius: 6,
                  background: investmentGoal === goal.key ? THEME.bgRaised : THEME.bgPanel,
                  display: "flex", alignItems: "center", gap: 8,
                  justifyContent: "center", cursor: "pointer",
                  color: investmentGoal === goal.key ? THEME.accent : THEME.text,
                  fontWeight: 600, fontSize: 13
                }}
              >
                {goal.icon}
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label-xs" style={{ marginBottom: 10 }}>Top Recommended Markets For Your Goal</div>
          {recommendedMarkets.map((market, idx) => renderMarketCard(market, true, idx + 1))}
        </div>
      </Panel>

      {/* 6. TOP 5 MARKETS */}
      <Panel title="Top 5 Markets" icon={<Trophy size={16} />}>
        <div style={{ marginBottom: 16 }}>
          <div className="label-xs" style={{ marginBottom: 8 }}>Rank by:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "capRate", label: "Cap Rate" },
              { key: "rentGrowth", label: "Rent Growth" },
              { key: "score", label: "Overall Score" },
              { key: "brrrrScore", label: "Deal Score" }
            ].map(metric => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                style={{
                  padding: "6px 12px", fontSize: 12,
                  background: selectedMetric === metric.key ? THEME.accent : THEME.bgPanel,
                  color: selectedMetric === metric.key ? THEME.bg : THEME.text,
                  border: `1px solid ${selectedMetric === metric.key ? THEME.accent : THEME.border}`,
                  borderRadius: 4, fontWeight: 600, cursor: "pointer"
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        {topMarkets.map((market, idx) => renderMarketCard(market, true, idx + 1))}
      </Panel>
    </div>
  );
};
