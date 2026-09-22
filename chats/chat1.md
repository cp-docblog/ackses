# Car parts marketplace app

_Started 2026-09-21 01:37 UTC_

---

## User

I have added the design system as an attachment... we want to create a marketplace app for car parts... we want

Seller's app:
Seller account page
Seller's Shop page
include all the popups and stuff to add a new product, etc

Buyer's app:
Onboarding (ask him about his current car, model, etc)
Buyer Profile
Listings (where he can shop)
Shop's profile
Seller Profile
Cart
make sure that there are advanced features to search through the app.
take Alibaba as a reference

## Assistant



## Assistant

_[tool: set_project_title]_

_[tool: ask_user]_

Waiting on your answers (language, platforms, search features, format) — then I'll build the ACKSES buyer and seller screens from the brand sheet.

## User

Answered — language: Bilingual toggle; platform: Buyer: mobile (phone frames), Seller: mobile (phone frames); search: Filter by my car (make/model/year), VIN / chassis number lookup, Part number (OEM) search, Search by image, Category tree + filters (brand, condition, price, city), Compatibility badge on listings, S…; format: Both; market: Iraq only (IQD, Iraqi cities), New + used parts, Delivery + cash on delivery

## Assistant

_[tool: copy_starter_component]_

_[tool: grep]_

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

Out for review: 15 live phone screens in one canvas — buyer (onboarding, VIN sheet, listings, filters, image search, product, shop, seller, profile, cart) and seller (account, my shop, 3-step add product, order status, delete dialog). Tweaks panel switches EN/AR and canvas/prototype mode; the EN/ع toggles inside the phones do the same.

Caveats: part photos are striped placeholders; checkout/order-tracking and RFQ aren't built yet — say the word if you want them next.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Fixed the delivery-label collision, the shop header overlap, and the wrapping chips on Listings. Back out for review.

