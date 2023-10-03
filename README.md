# Co₂ordinate

Find the most efficient place to gather GHG-wise.

<img width="1706" alt="Screenshot 2023-10-02 at 16 11 45" src="https://raw.githubusercontent.com/developmentseed/co2ordinate/main/static/co2ordinate.webp">

- 🌍 Add your people by clicking on the map or uploading a .csv.
- 🌍 Group your people my team.
- 🌍 With 2+ people added, see the CO₂ impact of the group's flights.
- 🌍 Explore the suggested meeting location which optimize for co₂ impact and the "home" location of at least one group member.
- 🌍 Change your analysis by selecting and de-selecting individuals or teams. Information is stored locally.

## Motivation
The climate crisis is wreaking havoc on the world, and flights are the most carbon-intensive activity most individuals partake in. However, flights are a necessary tool in modern society. Remote companies, conference organizers, and event managers could make a real impact by optimizing their meeting locations to reduce their CO₂ impact. 

## Methodology

Our approach is explicitly “low-resolution”. It gives orders of magnitude, rather than precise estimates. 
The algorithm will go through all worldwide major airports (using the [OurAirports](https://ourairports.com/data/) database), compute CO2eq estimates for each participant-airport pair, and finally sort results based on the cumulative emissions for each round trip to each airport. Distances are approximated using the great circle distance ([Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula)), applying a factor depending on the flight distance (long haul/short haul/domestic) based on the methodology described in [this article](https://ourworldindata.org/travel-carbon-footprint).

## Limitations
- Our current tool is anchored on a simple premise: CO2 emissions estimation based on flight distances. While effective in its own right, this method has left room for improvement. We've noticed that our estimates are consistently higher than those of commercial flight planners, and the discrepancies sometimes are pretty significant.
- Actual routing isn't factored in (because routing data is expensive and proprietary), meaning that only direct flights are being calculated, whether or not the direct flight actually exists.
- Only flights are factored in at this time (no option for other modes of transporation).

## Installation

The app is a straightforward React app that was initially set up to work in our intranet using our great [UI library](https://ui.ds.io/).

Clone the repo.

Then run:

```
yarn
yarn start
```
