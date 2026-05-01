# QA Test Cases

## Scope

- Account create/connect and member selection
- Log Payment flow and duplicate-prevention lock
- Success overlay behavior
- Stats filters/range controls and visualizations
- Settings modal behavior, category management, and theme toggle
- Dark mode visual checks
- Mobile/iOS scrolling and safe-area behavior

## Test Environment

- App URL: http://localhost:3000
- Browser: Safari iOS + Chrome desktop (recommended)
- Data: clean DB + at least one account with records in multiple categories

## Functional Test Cases

1. Create Account

- Steps: Open app, enter name, click Create Account.
- Expected: Account ID appears, user enters action screen, no error banner.

2. Connect Account

- Steps: Enter name + valid Account ID, click Connect Account.
- Expected: Connected successfully and records load.

3. Who Paid default ordering

- Steps: Open action screen.
- Expected: Current user (ME) appears first in payer chips.

4. Category button click save

- Steps: Select payer and click one category once.
- Expected: Exactly one new record appears.

5. Duplicate prevention on rapid click

- Steps: Tap same category rapidly 3-5 times.
- Expected: Only one record is created during lock window.

6. Saved overlay visibility

- Steps: Save a record.
- Expected: Centered check overlay appears with title + category text and dismisses automatically.

7. Saved overlay wording

- Steps: Save a record in EN and 繁中.
- Expected: EN shows Recorded + Category: ...; 繁中 shows 已記錄 + 分類：...

8. Stats payer ranking

- Steps: Open Stats.
- Expected: Payer ranking bars shown above pie section.

9. Stats category breakdown legend

- Steps: Open Stats with multi-category data.
- Expected: Pie and legend percentages are consistent with counts.

10. Stats category filter

- Steps: Open category filter and select one category.
- Expected: Stats update to selected category only.

11. Date preset selection

- Steps: Tap 1d, 7d, 30d.
- Expected: Records update per selected preset.

12. Custom range picker apply

- Steps: Open custom range picker, choose valid start/end, apply.
- Expected: Stats update; selected range shown.

13. Custom range validation

- Steps: Choose invalid range (start after end).
- Expected: Validation message appears; data not reloaded with invalid range.

14. Settings single-scroll behavior

- Steps: Open Settings, try scrolling backdrop and modal.
- Expected: Only inner modal scrolls; background layer does not scroll.

15. Date picker overflow behavior

- Steps: Open date picker on narrow viewport.
- Expected: Date fields fit within modal width; no horizontal overflow.

16. Settings top spacing

- Steps: Open Settings on mobile.
- Expected: Modal has visible top gap (not stuck to top edge).

17. Theme toggle persistence

- Steps: Switch to dark mode, refresh page.
- Expected: Dark mode persists after reload.

18. Dark mode action category buttons

- Steps: Open action screen in dark mode.
- Expected: Category buttons have dark, readable backgrounds and clear hover/active states.

19. Safe-area/status bar color

- Steps: iOS Safari with dark mode on.
- Expected: Top safe-area/status region uses dark color (not white).

20. API category acceptance

- Steps: Save records for Meal, Groceries, Snacks, Transport, Entertainment, Baby, Parking.
- Expected: No 400 Invalid category error for these supported categories.

21. iOS category reorder fallback

- Steps: Open Settings on iOS Safari and reorder categories using up/down controls.
- Expected: Category order updates immediately and persists after closing/reopening Settings.

## Non-Functional Checks

22. Lint

- Command: npm run lint
- Expected: no lint errors.

23. Production build

- Command: npm run build
- Expected: successful compile and static checks.
