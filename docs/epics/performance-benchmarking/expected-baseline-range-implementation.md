# Site Kit Benchmarking: Expected Baseline Range Implementation

## 1\. Executive Summary

The Site Kit Benchmarking & Forecasts feature adds an analytical visual comparison and natural-language insight narrative to the WordPress dashboard. By overlaying a site's actual daily traffic against an expected baseline range, site owners can immediately understand whether their performance is beating expectations, tracking normal seasonal patterns, or underperforming.

This document proposes the mathematical specification for calculating the expected baseline range: a **Decomposed Exponentially Weighted Moving Average (EWMA)** combined with **Annual YoY Seasonality**, surrounded by an **Adaptive Square-Root Uncertainty Band** computed directly in JavaScript from Google Analytics 4 (GA4) data.

---

## 2\. Intended UI & Visual Architecture

### UI Visualization Mock (current Figma design)

### ![][image1]

The target UI component presents a multi-series time-series chart over a standard evaluation period (typically the last 28 days) with date tick marks on the X-axis and metric counts on the Y-axis.

1. **Expected Traffic Baseline (Shaded Area Band)**: A light purple shaded area representing the lower and upper bounds of expected traffic for each day (`expected_range_min` to `expected_range_max`).  
2. **Actual Traffic (Solid Line)**: A solid dark purple line representing the daily actual traffic metric (e.g., visitors, sessions, or pageviews) over the same 28-day window.

---

## 3\. Client-Side Plugin Computation Architecture

By framing the baseline calculation as a **stateless, closed-form arithmetic calculation** that relies only on a site's own GA4 daily traffic, we shift the computation directly to the **WordPress Plugin (Client-Side JavaScript / React)**.

- **GA4 Data Fetching**: Retrieves daily time-series data from Google Analytics 4 via existing Site Kit data stores (`modules/analytics-4`).  
- **Stateless Baseline Calculation**:  
  - Computes the expected baseline value `predicted_traffic(t)` for each day `t` in the 28-day chart period using a client-side utility selector.  
  - Calculates the UI boundaries around the predicted traffic using adaptive square-root scaling:  
    - `expected_range_min(t) = MAX(0, predicted_traffic(t) - ribbon_width(t))`  
    - `expected_range_max(t) = predicted_traffic(t) + ribbon_width(t)`  
- **Chart Rendering**: Renders the shaded expected range ribbon and daily actual traffic line instantly in the dashboard without waiting for a backend service call.

---

## 4\. Canonical Baseline Calculation: Decomposed Level \+ Weekday Factor \+ Seasonality

To model web traffic accurately without machine learning while achieving maximum statistical stability at low volumes, the calculation isolates the fundamental drivers of web traffic: **Day-of-Week Seasonality**, **Annual Calendar Seasonality**, **Long-Term Structural Trend**, and **Special Holiday Events**.

By decomposing the baseline into an **Overall Daily Base Level (`daily_base_level`)** and a **Day-of-Week Factor (`weekday_factor`)** across **9 weeks (63 days)** of trailing GA4 data already in browser memory, we eliminate daily random jitter without requiring any additional data loading.

### The Three-Step Point Prediction Formula

For any day `t` falling on a specific day of the week (`Mon ... Sun`) in the chart window, the point prediction `predicted_traffic(t)` is computed in client-side JavaScript as:

`predicted_traffic(t) = daily_base_level * weekday_factor(day_of_week) * annual_seasonality(t)`

#### Step 1: 9-Week Day-of-Week Factor (`weekday_factor`)

To capture a site's stable weekday vs. weekend behavioral profile without daily jitter, compute the dimensionless ratio for each day of the week across the 9 weeks (63 days) of trailing GA4 data:

`weekday_factor(day_of_week) = (Sum of traffic on that day of the week over past 9 weeks) / ( (1 / 7) * Total traffic across all 63 days )`

- *Interpretation*: `weekday_factor = 1.00` represents an average day, `1.20` is `+20%` above average, `0.70` is `-30%` below average.  
- *Why 9 Weeks is Ideal*: Observing 9 occurrences of each weekday is plenty to dilute single-day noise on small sites while requiring zero additional GA4 data loading.

#### Step 2: Whole-Week EWMA & Daily Base Level (`daily_base_level`)

Instead of deseasonalizing 63 individual days, aggregate the 63 days into **9 whole-week traffic totals (`weekly_total(1) ... weekly_total(9)`)**, eliminating all daily random jitter.

To ensure deterministic parity across implementations and prevent extreme outliers from hijacking the baseline, apply the following explicit seeding and Winsorization rules:

1. **Deterministic Seeding Rule (Mean of First 3 Weeks)**: Initialize `weekly_ewma(1)` as the arithmetic mean of the first 3 available whole-week totals: `weekly_ewma(1) = (1 / 3) * SUM_{k=1...3}( weekly_total(k) )`  
     
   - *Why Mean Seeding is Essential*: In an EWMA with `alpha = 0.20`, 16.8% of the initial seed persists after 9 weeks (`0.80^8 = 0.168`). Averaging the first 3 weeks immediately dilutes initial single-week noise (such as a holiday or server outage) and guarantees deterministic parity across client and server implementations.

   

2. **Two-Sided Winsorization (Outlier Capping)**: Before feeding an incoming weekly total `weekly_total(w)` into the recursion for weeks `w = 2 ... 9`, clamp it to a factor-of-2 boundary around the current baseline: `weekly_total_capped(w) = CLAMP( weekly_total(w), 0.50 * weekly_ewma(w - 1), 2.00 * weekly_ewma(w - 1) )`  
     
   Then recursively update the whole-week EWMA (`alpha = 0.20`) using the capped value: `weekly_ewma(w) = 0.20 * weekly_total_capped(w) + 0.80 * weekly_ewma(w - 1)`  
     
   - *Why Two-Sided Winsorization is Essential*:  
     - **On the way up**: Clamping a 10x viral spike at `2.00x` limits the maximum single-week baseline shift to `+20%`, preventing one-off outliers from hijacking the baseline.  
     - **On the way down**: Clamping a 0-visitor tracking outage at `0.50x` limits the maximum single-week baseline drop to `-10%`, protecting expectations against temporary hosting or tag-disconnect glitches.

Compute the daily structural base level by dividing the final whole-week EWMA by 7:

`daily_base_level = weekly_ewma(9) / 7`

- *Why Whole-Week EWMA is Superior*: By summing across 7 days, `daily_base_level` achieves **7x more data density**, providing a rock-solid operational baseline that makes adaptive square-root ribbon scaling possible even on low-volume sites.

#### Step 3: Annual Seasonality Multiplier (`annual_seasonality`)

To insulate against annual calendar events (such as Black Friday shopping surges or summer school closures), adjust the baseline by last year's seasonal percentage change for that same week:

`annual_seasonality(t) = traffic_last_year(t) / prior_4w_average_last_year(t)`

- `traffic_last_year(t) = y(t - 364)`: Actual traffic on the exact same weekday and calendar week 1 year ago (since 52 weeks is exactly 364 days).  
- `prior_4w_average_last_year(t)`: Average traffic on that same weekday over the 4 weeks leading up to that date last year: `prior_4w_average_last_year(t) = (1 / 4) * SUM_{k=1...4}( y(t - 364 - 7k) )`  
- *Example*: If a Tuesday jumped by \+30% during Black Friday week last year (`annual_seasonality = 1.30`), this year's current baseline is scaled up by 1.30 for that Tuesday.

---

## 5\. Uncertainty Band (Adaptive Square-Root Scaling)

### Why Square-Root Scaling Matches Traffic Variance

In daily website visitor counts, Poisson and Negative Binomial dispersion dictates that day-to-day variance scales as the **square root of the mean (`SQRT(mean)`)**, not linearly with the mean.

To adaptively scale the ribbon across all WordPress site sizes in a single closed-form calculation, compute the ribbon width directly proportional to the square root of the predicted traffic with a minimum absolute floor:

`ribbon_width(t) = MAX(5, 3 * SQRT(predicted_traffic(t)))`

The upper and lower UI boundaries around the point prediction are rendered as:

- `expected_range_min(t) = MAX(0, predicted_traffic(t) - ribbon_width(t))`  
- `expected_range_max(t) = predicted_traffic(t) + ribbon_width(t)`

### Behavior Across Site Tiers & 95% Coverage Target

By setting the square-root multiplier to `3` (corresponding to approximately 3 standard deviations in Poisson count data), the ribbon automatically achieves **\~95% historical coverage** across all WordPress site tiers without thresholds, tuning, or visual step-changes:

| Site Traffic Tier | Daily Prediction (`predicted_traffic`) | Adaptive Ribbon Width (`ribbon_width`) | Effective Percentage Band | UX Result |
| :---- | :---- | :---- | :---- | :---- |
| **Small Site** | `25 visitors / day` | `+/- 15 visitors` | `+/- 60%` | **Honest Wide Band**: Absorbs small-site daily variance; eliminates false alarms. |
| **Medium Site** | `400 visitors / day` | `+/- 60 visitors` | `+/- 15%` | **Standard Band**: Tracks normal operational fluctuations. |
| **Large Site** | `10,000 visitors / day` | `+/- 300 visitors` | `+/- 3%` | **Tight Enterprise Band**: Highly sensitive to genuine structural drops or surges. |

- *Weekday Shape Benefit*: Because the ribbon scales as `SQRT(predicted_traffic(t))`, the band is **absolutely wider at weekday peaks but proportionally tighter there**, perfectly matching natural time-series UI aesthetics.

---

## 6\. Fallback Strategy for Newer Sites (\< 13 Months GA4 Data)

For WordPress sites that have been installed for less than 13 months (\~392 days), the plugin cannot calculate `annual_seasonality(t)`.

### Two-Tier Client-Side Selector Fallback

1. **Primary Selector (\>= 13 Months GA4 Data)**:  
   - Evaluates full seasonality: `predicted_traffic(t) = daily_base_level * weekday_factor(day_of_week) * annual_seasonality(t)`  
   - Displays adaptive square-root ribbon around `predicted_traffic(t)`.  
2. **Fallback Selector (\< 13 Months GA4 Data)**:  
   - Automatically drops the annual seasonal multiplier: `predicted_traffic(t) = daily_base_level * weekday_factor(day_of_week)`  
   - Displays adaptive square-root ribbon around `daily_base_level * weekday_factor(day_of_week)`.  
   - Requires only 56 to 63 days (\~8 to 9 weeks) of trailing GA4 data to establish a stable weekday baseline.

If there is less than 9 weeks of data available, we should just show predict the avg of whatever weeks of data (for the same day of the week) there are.

---

## 7\. Why Alternative Approaches Were Rejected

| Alternative Approach | Mathematical Flaw / Trade-Off | Why Rejected for Site Kit |
| :---- | :---- | :---- |
| **Simple Moving Average (8–18 Weeks SMA)** | Hard cutoff cliff (`12.5%` weight for week 8, `0%` for week 9). 18-week SMA crosses calendar seasons, dragging baselines down with out-of-season data. | EWMA (`alpha = 0.20`) provides superior stability and freshness without artificial window cutoffs. |
| **Stacking Trend Multipliers (`R_t * S_annual * T_weekly`)** | Double-counts trend. `R_t` already embodies current scale; multiplying by an extra forward-growth ratio compounds exponentially and consistently overestimates. | EWMA naturally incorporates structural growth into current scale; `annual_seasonality` is the only multiplier needed. |
| **Server-Side ML / Time-Series (Prophet / ARIMA)** | Requires storing multi-year daily time-series per tenant on the backend and executing computationally heavy batch inference. | Unnecessary engineering complexity. Client-side EWMA \+ seasonality achieves high precision statelessly in `< 1 ms`. |
| **56-Day Normalized Residual MAD Band** | Requires sorting 56-day residual arrays, computing medians, absolute deviations, and MAD multipliers in JavaScript. | Overly complex for client-side execution. The direct square-root ribbon (`3 * SQRT(predicted)`) achieves identical \~95% coverage in 1 line of code. |

---

## 8\. Lookahead Feature: Forecasting the Next 4 Weeks

To project web traffic forward into the future (days `t = +1 ... +28` into the future), the plugin extends the baseline framework by combining a **Frozen Weekday Baseline (`daily_base_level * weekday_factor`)** with **Active Forward Seasonality (`annual_seasonality`)**.

### 1\. The Lookahead Point-Prediction Formula

For any future day `t` in the 28-day lookahead window:

`predicted_traffic(t) = daily_base_level * weekday_factor(day_of_week) * annual_seasonality(t)`

- **Frozen Weekday Baseline (`daily_base_level * weekday_factor(day_of_week)`)**: For future day `t` falling on a given day of the week, the structural operating scale is held constant at its most recent level calculated up through today.  
  - *Why Baseline is Frozen*: Recursively feeding seasonally-adjusted predictions back into a baseline smoother permanently traps holiday spikes in the structural baseline. Holding the baseline steady establishes a reliable, conservative "hold steady" benchmark.  
- **Active Forward Seasonality (`annual_seasonality(t)`)**: Even though `t` is in the future, day `t - 364` is in the past. Using last year's exact traffic for that future calendar date (`traffic_last_year(t) = y(t - 364)`) and its prior 4-week baseline (`prior_4w_average_last_year(t)`), the plugin computes the exact seasonal lift: `annual_seasonality(t) = y(t - 364) / prior_4w_average_last_year(t)`  
- *Why This Works*: Even though the baseline operating scale is anchored at today's level, the 28-day future lookahead curve dynamically mirrors the exact seasonal shape of those same 4 weeks last year (e.g., surging for holiday shopping or dipping for summer closures).

### 2\. UI Representation: Widening Uncertainty Ribbon

In time-series forecasting, uncertainty increases the further into the future you look. To prevent starting on Day \+1 at zero width (which asserts perfect knowledge of tomorrow and makes normal Day \+2 variance look like a defect), the lookahead ribbon starts at today's adaptive square-root width and widens linearly by **\+5% per week** across the 4-week horizon (`k = 1 ... 4` weeks into the future):

`lookahead_ribbon_width(t + k) = MAX(5, 3 * SQRT(predicted_traffic(t + k))) * (1 + 0.05 * k)`

- **Week 1 (+1 to \+7 days)**: `1.05x` today's adaptive ribbon width.  
- **Week 2 (+8 to \+14 days)**: `1.10x` today's adaptive ribbon width.  
- **Week 3 (+15 to \+21 days)**: `1.15x` today's adaptive ribbon width.  
- **Week 4 (+22 to \+28 days)**: `1.20x` today's adaptive ribbon width.

### 3\. Actionable Value & Narrative Triggering

By summing the 28 daily lookahead predictions (`SUM_{t=1...28}( predicted_traffic(t) )`) and comparing them against the past 28 days of actual traffic, the plugin can triggers proactive natural-language insights from the Benchmarking Insights feature.

- **Upcoming Seasonal Boom**: If `SUM( predicted_traffic ) > Past 28d Actuals + 15%`, the UI surfaces an encouraging lookahead alert (e.g., *"Based on your annual seasonality, your traffic is projected to grow by \~20% over the next 4 weeks as holiday demand picks up"*).  
- **Upcoming Seasonal Lull**: If `SUM( predicted_traffic ) < Past 28d Actuals - 15%`, the UI sets expectations for an upcoming seasonal drop (e.g., *"Your traffic is projected to enter an expected seasonal lull over the next 4 weeks, dropping by \~15%"*).

[image1]: <data:image/png;base64,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>