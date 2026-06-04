# Test Plan — Harta Petroșani

Run through all flows below after any refactoring. Each item is a discrete action
and an expected result. If anything behaves differently, the refactor broke it.

---

## 0. Setup

- [ ] Start dev server (`npm run dev`)
- [ ] Open **http://127.0.0.1:8788** in browser (view-only mode)
- [ ] Open **http://127.0.0.1:8788/?edit=luminita** in a second tab (edit mode)

---

## 1. Map basics

| # | Action | Expected |
|---|--------|----------|
| 1.1 | Load the page | Map renders, pins visible, labels hidden |
| 1.2 | Zoom in past threshold | Labels fade in |
| 1.3 | Zoom back out | Labels fade out |
| 1.4 | Pan the map | Map follows cursor, stays within bounds |
| 1.5 | Hover a pin | Label of that pin renders on top of nearby labels |
| 1.6 | Hover a pin while another is selected (red icon) | No z-order change |

---

## 2. View-only mode (no token)

| # | Action | Expected |
|---|--------|----------|
| 2.1 | Press `P` | Nothing happens |
| 2.2 | Click a pin | View panel slides in from the right |
| 2.3 | View panel shows name, description, photos | Correct data for that pin |
| 2.4 | Author/year/description visible in photo lightbox if set | Correct metadata |
| 2.5 | Edit button absent from view panel | Not visible |
| 2.6 | Click elsewhere on the map | View panel closes |
| 2.7 | Click close button on view panel | View panel closes |

---

## 3. Pin selection flow (view-only)

| # | Action | Expected |
|---|--------|----------|
| 3.1 | Click a pin | Camera pans to place pin on right side; view panel opens on left |
| 3.2 | Pin icon turns red/selected | Selected icon shown |
| 3.3 | Click another pin while one is selected | Previous pin reverts icon; new pin selected |
| 3.4 | Click map background | Selection cleared, view panel closes, camera flies out |

---

## 4. Edit mode — entering / exiting

| # | Action | Expected |
|---|--------|----------|
| 4.1 | Press `P` in edit tab | Crosshair cursor; notification "Pin placement mode ON" |
| 4.2 | Press `P` again | Crosshair gone; notification "Pin placement mode OFF" |
| 4.3 | Click a pin → click Edit button | Camera flies to pin; edit panel opens; pin label moves above pin |
| 4.4 | Click close (×) in edit panel | Edit panel closes; camera flies out; label returns to left of pin |
| 4.5 | Edit mode: click map background | Edit panel closes (same as 4.4) |

---

## 5. Pin editing

| # | Action | Expected |
|---|--------|----------|
| 5.1 | Edit pin name | Label updates live on map above pin |
| 5.2 | Clear pin name entirely | Label disappears from map |
| 5.3 | Click left/right arrows | Pin icon cycles through types |
| 5.4 | Arrow click gives pulse animation | Arrow briefly scales up then back |
| 5.5 | Cycle to mine type | Label text turns black |
| 5.6 | Click Actualizează | Panel closes, changes persisted; reload page to verify |
| 5.7 | Make changes then click × (discard) | All changes reverted — name, type, position |

---

## 6. Pin creation

| # | Action | Expected |
|---|--------|----------|
| 6.1 | Press `P`, click on map | New pin appears; camera flies to it; edit panel opens ("Pin nou") |
| 6.2 | Type a name, click Salvează | Pin saved; panel closes; reload to verify pin persists |
| 6.3 | Press `P`, click on map, then click × | New pin removed entirely; nothing saved |

---

## 7. Pin dragging

| # | Action | Expected |
|---|--------|----------|
| 7.1 | Enter edit mode, hover pin icon | Grab cursor |
| 7.2 | Hover arrows | Pointer cursor (not grab) |
| 7.3 | Click and drag pin | Pin follows cursor; label, panel, and arrows fade out |
| 7.4 | Drag pin to edge of screen | Map auto-scrolls in that direction |
| 7.5 | Drag to upper-left corner | Map scrolls both up and left |
| 7.6 | Release pin | Panel and label fade back in; camera re-centers pin at edit position |
| 7.7 | Click Actualizează after drag | New position saved; reload to verify |
| 7.8 | Drag pin then click × (discard) | Pin returns to original position |

---

## 8. Pin deletion

| # | Action | Expected |
|---|--------|----------|
| 8.1 | Enter edit mode, click delete button | Button changes to "Ești sigur?" confirmation |
| 8.2 | Click the × inside the delete button | Confirmation cancelled, back to normal state |
| 8.3 | Click elsewhere in the panel | Confirmation cancelled |
| 8.4 | Click delete then confirm | Pin removed from map; panel closes; reload to verify gone |

---

## 9. Photos — view mode

| # | Action | Expected |
|---|--------|----------|
| 9.1 | Click pin with photos | Photos show as thumbnails in view panel |
| 9.2 | Click a thumbnail | Lightbox opens |
| 9.3 | Navigate with arrows in lightbox | Photos cycle correctly |
| 9.4 | Photo with description | Caption shown below image |
| 9.5 | Photo with author + year | Credit shown bottom-right |
| 9.6 | Photo with no description | Image centered, no caption space |
| 9.7 | Press Escape or click outside | Lightbox closes |

---

## 10. Photos — edit mode

| # | Action | Expected |
|---|--------|----------|
| 10.1 | Edit mode: photos show with pen overlay on hover | Overlay visible on hover |
| 10.2 | Click pen on a photo | Lightbox opens in edit mode |
| 10.3 | Edit description, blur field | Auto-saved |
| 10.4 | Edit author / year | Auto-saved |
| 10.5 | Navigate to next photo in edit lightbox | Previous edits saved before switching |
| 10.6 | Upload a new photo | Thumbnail appears; saved on Actualizează |
| 10.7 | Remove a photo (× on thumbnail) | Thumbnail removed; deleted on Actualizează |

---

## 11. Label behaviour

| # | Action | Expected |
|---|--------|----------|
| 11.1 | Normal mode: label to the left of pin | Correct position |
| 11.2 | Enter edit mode | Label animates to above pin, smaller font, thinner stroke |
| 11.3 | Exit edit mode | Label animates back to left, font and stroke restore |
| 11.4 | Cycle pin type in edit mode | Label stays above (no fade) |
| 11.5 | Edit pin name in edit mode | Label stays above, updates live |

---

## 12. API security (after adding auth to endpoints)

| # | Action | Expected |
|---|--------|----------|
| 12.1 | `curl -X PATCH /api/pins/<id>` without token | 401 response |
| 12.2 | `curl -X DELETE /api/pins/<id>` without token | 401 response |
| 12.3 | `curl -X POST /api/images` without token | 401 response |
| 12.4 | Same requests with correct token header | 200 response |
| 12.5 | Delete a pin with photos via API | Images also deleted from DB |

---

## 13. Regression — things that broke before

| # | What to verify |
|---|----------------|
| 13.1 | Arrows don't teleport on click (inner/outer g fix) |
| 13.2 | Drag doesn't reset zoom level on drop |
| 13.3 | Discarding edit after drag reverts pin to original position |
| 13.4 | Arrows fade out during drag |
| 13.5 | Label moves up on enter edit, back left on exit |
| 13.6 | Clicking arrow doesn't trigger grab/drag |
