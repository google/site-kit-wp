*author: [Mariya Moeva](mailto:mmoeva@google.com)*  
*last update: Apr 9, 2026*  
*status: Ready for review*

| performance intelligence: site benchmarking & forecasts           help users understand real growth, anomalies, and seasonal shiftsgo/sitekit-benchmarking |
| :---- |

[Problem](#problem)

[Opportunity](#opportunity)

[Proposed solution](#proposed-solution)

[Requirements](#requirements)

[1\. Availability & triggering](#1.-availability-&-triggering)

[2\. Positioning and visual appearance](#2.-positioning-and-visual-appearance)

[3\. Backend data generation & analysis capabilities](#4.-backend-data-generation-&-analysis-capabilities)

[Multiple admins, dashboard sharing](#multiple-admins,-dashboard-sharing)

[Open questions](#open-questions)

[Success metrics](#success-metrics)

## Problem  {#problem}

The majority of Site Kit users lack the necessary context or expertise to interpret their site’s performance. Without context or an understanding of seasonality, metrics like “unique visitors” and “sessions” might be difficult to understand and weekly or monthly fluctuations can be misleading or cause undue stress. 

Users struggle to answer "Is this change normal for my site?" or "Am I actually growing?"  
A repeated request from users is to get a more opinionated view to help them gauge if what they’re seeing on the dashboard is “good” or “bad”. 

## Opportunity  {#opportunity}

**For Site Kit:** 

* Enhance Site Kit's value: make Site Kit a more indispensable tool by providing unique, easy-to-understand insights.  
* Increase goodwill, become a trusted advisor: help users focus on relevant information and understand if the web is contributing to their goals. 

**For site owners**:

* Better understand their site's performance in context and focus on what is actually meaningful, and which fluctuations to pay attention to.   
* Increase confidence in site growth: Easily recognize genuine growth trends, stripped of seasonal noise.  
* Save time analyzing trends: get immediate context on traffic fluctuations without manual data checks and comparisons.   
* React appropriately to changes: differentiate between normal seasonal shifts and actual anomalies requiring attention.

## Proposed solution  {#proposed-solution}

Introduce a new widget within the "Traffic" section of the Site Kit dashboard (title TBD, could be e.g. "Understand your traffic patterns"). This widget will be placed right below the main traffic graph to maintain context and will provide:

* Key metric comparisons: core traffic metrics (e.g., unique visitors) for the selected date range, compared against the previous period and the same period last year.  
* Trend indicators: use clear visual cues (e.g., up/down arrows, color-coding, percentage changes) to highlight performance shifts.  
* Insightful snippets: short, non-technical text explanations of what the data means, including notes on potential seasonality, anomalies, or underlying trends.  
* Low-traffic adjustments: for sites with limited data, adapt the analysis to focus on longer-term trends and provide disclaimers about data volatility.

## Requirements  {#requirements}

### **1\. Availability & triggering** {#1.-availability-&-triggering}

The feature should be available to all sites which have GA data recorded over the past 13 months (necessary for proper comparison and seasonality calculations) 

### **2\. Positioning and visual appearance**  {#2.-positioning-and-visual-appearance}

* The insights will be displayed in a dedicated widget within the "Traffic" tab of the Site Kit dashboard, to provide immediate context.  
* The UI should clearly present:  
  * Unique Visitors: \[Number\] (Selected Period)  
  * vs. Previous Period: \[+/- X%\]  
  * vs. Same Period Last Year: \[+/- Y%\]  
  * Insight:   
    * dynamic text explaining these changes, mentioning seasonality if applicable.  
    * if available, offer “look ahead” \- e.g. dip or growth is expected in the next period (28 days default) based on seasonal patterns   
* Include options for users to leave feedback   
  * MVP: relevant/non relevant (thumbs up / down)   
  * \[stretch\] add functionality for users to provide more nuance \- e.g. the widget is not relevant because the data is incorrect, outdated, etc.   
* Language and tone: simple, clear, and avoiding jargon. The tone should be helpful and encouraging.

Sample summaries:

* "Your traffic is up 15% from last month, and 25% higher than this time last year\!"  
* "Traffic dipped 10% this period, similar to the seasonal trend seen last year."  
* "Site traffic remains steady."

### **3\. High-level questions the feature should be able to answer** 

* Is my site doing better or worse than average?   
* How is seasonality affecting my traffic?  
* Overall, is my site growing?   
* What is the outlook for the near future? what should I expect  
* What is helping, what is not working?

### **4\. Backend data generation & analysis capabilities** {#4.-backend-data-generation-&-analysis-capabilities}

To power the widget, the backend system must have the following capabilities:

* **Historical data retrieval**: fetch time series data (e.g., daily unique visitors) from the Google Analytics API for at least the past 13 months, and ideally 24+ months for more robust analysis.  
* **Baseline comparisons**: accurately calculate changes between the current period, the previous period, and the same period last year.   
* **Trend analysis**:   
  * differentiate between short-term fluctuations and longer-term trends in the data.  
  * identify potential step changes in performance levels.  
  * smooth data to reveal underlying trends, especially for sites with volatile or low traffic volumes, to reduce the impact of daily noise.  
* **Seasonality detection**:   
  * analyze year-over-year patterns to identify and account for recurring seasonal effects on traffic.   
  * flag if a current change is likely part of an expected seasonal pattern.  
  * check if there’s an expected change due to seasonality in the upcoming period (e.g. “your busiest period of the year with most visitors tends to happen in the next month”)   
* **Anomaly detection**:  
  * identify significant spikes or dips in traffic that fall outside the expected range based on historical trends and seasonality.  
* **Insight generation**: synthesize the analysis outputs into the concise, user-friendly text snippets for the UI.  
* **Handling low traffic sites**:   
  * utilize rolling averages (e.g., 7-day or 14-day) to smooth data for sites with low or volatile traffic, making underlying trends more apparent.  
  * present findings with cautious language and acknowledge potential for wide variations.  
  * de-emphasize day-to-day or week-to-week changes and focus on broader trends in the insight snippet for these sites.

## Multiple admins, dashboard sharing  {#multiple-admins,-dashboard-sharing}

This feature should be available to all users who have access to GA, either as the admin who set it up or as any other kind of user with whom GA has been shared. 

## Open questions  {#open-questions}

* What are the precise data thresholds (minimum daily sessions, number of months) required to power each level of analysis (anomaly, seasonality, trend)?  
* What is the acceptable latency for loading the insights within this new widget?  
* How can we best gather user feedback on the usefulness and accuracy of the insights? (e.g., thumbs up/down, categorical options).  
* How should we prioritize the development of the "stretch goals" (holiday impacts, error intervals)?  
* What is the best technical approach to deliver these analytical capabilities? (e.g., build into Site Kit Service, external open source libraries, other?). 

## Success metrics {#success-metrics}

* User feedback from within the widget (thumbs up/down, more detailed feedback where available)  
* Feedback from users in UXR studies, HaTS surveys, forums