# **Proposed driver hierarchy**

A unified model for prioritizing change drivers that solves channel crowding, eliminates duplicate cards, and surfaces actionable context.

## **1\. Candidate entities versus descriptive attributes**

To prevent orthogonal dimensions of the same visits (such as channel, device, and user type) from competing as separate cards, we divide all dimensions into two strict classes:

1. **Candidate driver entities (eligible to become UI cards):**  
* **\[Channel\]** (Organic search, direct, referral, organic social, paid search, email, organic video, unassigned)  
* **\[Content\]** (Specific landing page or article)  
* **\[Search keyword\]** (Specific search query from Search Console)  
* **\[Referring site\]** (Specific external referring domain or publication)  
* **\[Campaign\]** (Specific marketing campaign or newsletter)  
1. **Descriptive attributes (strictly barred from becoming cards):**  
* **Device** (mobile, desktop, tablet) and **User type** (new, returning) are never standalone cards. They only serve as contextual chips or narrative qualifiers (e.g., "...concentrated on mobile devices").

**Possible descriptive attributes per change driver entity type**  
(note: the actual UI will only show two of the attributes in each card)

* organic search channel → search keyword, content/landing page, user type, device   
* direct channel → content/landing page, user type, device   
* referral channel → referring site, content/landing page, user type, device  
* organic social channel → referring site, campaign, content/landing page, user type, device   
  * collapse variants: facebook.com / m.facebook.com / l.facebook.com / lm.facebook.com / FB → Facebook  
* paid channel → campaign, platform / source, user type, content/landing page, device  
* email channel → campaign, landing page, user type, device   
* AI channel → assistant (source), landing page, user type  
* organic video channel → platform, landing page, device  
* unassigned channel → landing page   
* content (page or article) → traffic channel, search keyword, user type, device, referring site  
* campaign → traffic channel, content/landing page, user type, device

## **2\. Data model: remapping sources to channels**

In Google Analytics 4, the raw referrers field represents the session source (`session_source`). We rename `referrers` to `top_sources` and map each incoming source to its parent channel:

* `facebook.com`, `x.com` \-\> Organic social  
* `substack.com`, `searchengineland.com` \-\> Referral  
* `google.com`, `bing.com` \-\> Organic search  
* `cpc` parameters (`?utm_medium=cpc`) \-\> Paid search

## **3\. Elevation versus aggregation rules**

We apply two threshold gates to decide whether to elevate a specific micro-entity to a card or aggregate to the parent channel:

1. **Noise floor:** Absolute movement must be at least 5 to 10 visitors.  
2. **Impact concentration:** The entity must account for at least 10% to 15% of the total site (or channel) movement.

### **Parent-child suppression**

* **When a micro-entity qualifies:** If an individual referring site (e.g., `substack.com`) or a specific landing page surges above the threshold, it is elevated as the primary card (`[Referring site] substack.com`). Its parent channel (`[Channel] Referral`) is suppressed to prevent double-counting.  
* **When no micro-entity qualifies:** If the channel moved because of many scattered visits across dozens of pages or referrers, the card aggregates cleanly at the channel level (`[Channel] Referral`).

## **4\. Channels with enriched context attributes**

When a channel card is shown, we attach its top specific sources as context attributes so site owners see where the traffic originated:

* **Organic social:** Display top platforms (e.g., facebook.com, x.com).  
* **Referral:** Display top referring websites (e.g., substack.com).  
* **Paid search / ads:** Display top campaigns or source parameters (e.g., `?utm_medium=cpc`).

## **5\. De-mystifying direct traffic**

Direct traffic is often unactionable when presented alone. We make it actionable by pairing it with available contextual clues:

* **Landing pages as primary attribute:**  
  * Landing on the homepage indicates brand recall, direct navigation, or bookmarks.  
  * Landing on a deep post or product indicates untracked link sharing through messaging apps, workplace chats, or email.  
* **URL parameter inspection:** Scan landing URLs for tracking remnants (e.g., `?fbclid=...` indicates in-app Facebook link clicks where referrer headers were dropped).  
* **Device correlation:** Explain device context alongside direct visits (mobile often correlates with mobile messaging apps; desktop correlates with workplace chats like Slack or Teams).

