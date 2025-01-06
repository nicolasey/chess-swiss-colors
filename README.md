# chess-colors

This library goal is to affect a Pairing with proper colors in all cases, following FIDE swiss system rules.

## Tech Part

To install dependencies:

```bash
bun add @nicolasey/chess-colors
```

## What is included 

- Color State calculator: give this `getColorPreference` a color history, and it will tell you what is the preferred color, and
what level of preference should be applied for this player
- Color Assigner: depending on 2 players color states, returns proper colors for given Pair 


## Kind reminders

* Random Color is to be physically chosen. Rule of FIDE says that higher ranked Player has to choose randomly the color before round 1. Software expect that the Referee sets the randomColor at tournamentStart
