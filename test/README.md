# Practice test and reference

This folder contains 41 selectable 31-question practice-test variations linked
from the **Тестови** page, along with notes transcribed from the supplied
reference images.

## Practice test

Choose a numbered test or the random-test button from the **Тестови** page.
Each numbered test uses a fixed, repeatable set of 31 questions sampled only
from questions tagged for driving licence category **Б** (car). Every variation
has its own button color and shape. The questions are sampled from the theory
data, so these are practice variations, not reconstructions of specific
archived tests. Answers can be entered and reviewed with the question buttons;
the score is shown after finishing.

## Theory JSON files

Each category has a JSON file in `../data/theory/`. The category letter is
prefixed to the filename for easier browsing; `categories.json` lists the
category metadata and filenames used by the Theory page.

| Category | Questions | JSON file | Question type |
| --- | ---: | --- | --- |
| A | 1–25 | `A-road-sign-name-matching.json` | Road signs: enter the number matching the sign's name (6 options) |
| B | 26–50 | `B-supplementary-plates.json` | Supplementary plate meanings (multiple choice, 3 options) |
| C | 51–75 | `C-sign-groups.json` | Identify which sign belongs to a group (image-based, choose one) |
| D | 76–90 | `D-road-sign-identification.json` | Road signs: enter the sign number (14 options, 3 boxes) |
| E | 91–162 | `E-police-signals-and-lights.json` | Police hand signals, traffic lights, and warning lights (multiple choice, 3 options) |
| F | 163–198 | `F-intersection-right-of-way.json` | Intersection right-of-way (multiple choice, 3 options) |
| G | 199–223 | `G-intersection-passing-order.json` | Order vehicles through an intersection (enter a 3-digit answer, e.g. `213`) |
| H | 224–241 | `H-vehicle-routes.json` | Vehicle route from A to B (multiple choice, 3 routes) |
| I | 242–331 | `I-traffic-rules-and-situations.json` | Traffic rules and situations (multiple choice, 3 options) |
| J | 332–349 | `J-parking-stopping-and-towing.json` | Parking, stopping, and towing (multiple choice, 3 options) |
| K | 350–385 | `K-traffic-rules.json` | Traffic rules (multiple choice, 3 options) |
| L | 386–424+ | `L-general-traffic-knowledge.json` | General knowledge: law, alcohol, and definitions (multiple choice, 3–4 options) |

## Answer key shown in the reference image

The answer-key sequence below describes the supplied reference image, not the
current category-„Б“ practice-test selection.

| Test question | Category answer |
| ---: | --- |
| 1 | A |
| 2 | B |
| 3 | C |
| 4 | I (guess) |
| 5 | I (guess) |
| 6 | E |
| 7 | E |
| 8 | E |
| 9 | E |
| 10 | F |
| 11 | F |
| 12 | G |
| 13 | H |
| 14 | I |
| 15 | K (or I, depending on the variation row) |
| 16 | I |
| 17 | K |
| 18 | K (or I) |
| 19 | I / K / J (varies across sheet versions) |
| 20 | I / K |
| 21 | I / K |
| 22–31 | L |

The image marks questions 1–21 with PNG attachments. It shows `PNG +1` for
questions 15 and 18, and `PNG +2` for questions 19–21. Questions 4 and 5 are
explicitly marked as guesses. The answers for questions 15 and 18–21 may vary
by sheet version, so verify them against the exact test variation before using
them as an authoritative key.

The category table extends category L through the available question set. The
reference image describes its range as `386–424+`; the current theory data
contains questions through 936.
