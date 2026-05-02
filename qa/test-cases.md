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

## Single-Member Room Gating (commit 1dec0b1)

24. Single-member room — homepage waiting card

- Steps: Create a new account (no partner joined yet).
- Expected: A "Waiting for your partner" card appears on the homepage showing the Account ID and a share hint.

25. Single-member room — Account ID copy button

- Steps: On the waiting card, click the copy button next to the Account ID field.
- Expected: Button switches to a check icon briefly; clipboard contains the Account ID.

26. Single-member room — record blocked via button

- Steps: On a single-member account, switch to action screen and click any category button.
- Expected: No record is created; an error message appears stating two people are needed.

27. Single-member room — payer chips disabled

- Steps: On a single-member account, view the action screen.
- Expected: Payer selection chips are visually disabled (opacity reduced) and not interactive.

28. Single-member room — category buttons disabled

- Steps: On a single-member account, view the action screen.
- Expected: All category buttons are disabled.

29. Single-member room — amber warning banner

- Steps: On a single-member account, view the action screen.
- Expected: An amber/yellow warning banner is shown above the payer chips describing the two-person requirement.

30. Two-member room — waiting card hidden

- Steps: Connect a second member to the account.
- Expected: The "Waiting for your partner" card is no longer shown on the homepage.

31. Two-member room — record logging re-enabled

- Steps: After a second member joins, attempt to log a record.
- Expected: Record is saved successfully with no error.

## Floating Refresh Button (commits 80b65bf, 78fef2d)

32. Refresh FAB visible on action screen

- Steps: Log in and view the action screen.
- Expected: A circular refresh button is visible in the bottom-right corner.

33. Refresh FAB — spinning state during refresh

- Steps: Tap the refresh button.
- Expected: The icon spins while data is loading; button is disabled during the spin.

34. Refresh FAB — "Updated" toast after success

- Steps: Tap the refresh button; wait for completion.
- Expected: A small toast ("Updated" / "已更新") slides in at the top and fades out automatically.

35. Refresh FAB — syncs member list

- Steps: While on the action screen, have the second user join; tap the refresh button.
- Expected: Member list updates (payer chips reflect the new member) without re-logging in.

36. Refresh FAB — disabled during delete

- Steps: Initiate a record delete.
- Expected: The refresh FAB is disabled (opacity reduced) until the delete and reload cycle completes.

37. Refresh FAB — safe-area positioning

- Steps: View the app in iOS Safari PWA mode.
- Expected: The FAB does not overlap the home indicator bar; sits visibly above the bottom edge.

## Save Overlay (commit 1807c48)

38. Save overlay — spinner shown immediately

- Steps: Tap a category button to save.
- Expected: A loading spinner overlay appears instantly while the record is being saved.

39. Save overlay — tick animation on success

- Steps: Save a record successfully.
- Expected: The spinner transitions to an animated green tick circle with a ping ripple effect.

40. Save overlay — title and category text

- Steps: Save a record.
- Expected: Overlay shows the "Recorded" / "已記錄" title and the saved category name below the tick.

41. Save overlay — auto-dismiss timing

- Steps: Save a record and observe the overlay.
- Expected: Overlay dismisses automatically after ~750 ms with no manual interaction required.

## PWA (commits 6c48e13, f256a31)

42. PWA installable

- Steps: Open app in Chrome; check browser install/add-to-homescreen prompt.
- Expected: Browser offers to install the app.

43. PWA theme color — light mode

- Steps: Install or open the app in light mode.
- Expected: Browser/status bar background uses the brand blue color (#0ea5e9).

44. PWA theme color — dark mode

- Steps: Switch to dark mode.
- Expected: Browser/status bar background switches to dark blue (#0f172a).

45. PWA app name

- Steps: Add to home screen and view the icon label.
- Expected: App name shows "Your Turn".

46. Service worker — cached assets load offline

- Steps: Load the app once, disable network, reload.
- Expected: Static assets serve from cache; app shell renders without network.

47. Service worker — navigation requests use network-first

- Steps: Load a fresh deployment; reload the page.
- Expected: Latest HTML is always fetched first; stale HTML is not served from cache.

## Duplicate Delete Prevention (commit 87f892f)

48. Duplicate delete lock — single API call

- Steps: Tap the delete button on a record rapidly multiple times.
- Expected: Only one DELETE API call is made; no duplicate delete errors.

49. Delete lock — UI feedback

- Steps: Start a delete operation.
- Expected: All delete buttons are disabled (greyed out) until the delete + reload cycle finishes.

## Non-Functional Checks

22. Lint

- Command: npm run lint
- Expected: no lint errors.

23. Production build

- Command: npm run build
- Expected: successful compile and static checks.
