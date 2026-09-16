# Site Kit Benchmarking: Expected Baseline Range Implementation

## 1\. Executive Summary

The Site Kit Benchmarking & Forecasts feature adds an analytical visual comparison and natural-language insight narrative to the WordPress dashboard. By overlaying a site's actual daily traffic against an expected baseline range, site owners can immediately understand whether their performance is beating expectations, tracking normal seasonal patterns, or underperforming.

This document proposes the mathematical specification for calculating the expected baseline range: a **Decomposed Exponentially Weighted Moving Average (EWMA)** combined with **Annual YoY Seasonality**, surrounded by an **Adaptive Square-Root Uncertainty Band** computed directly in JavaScript from Google Analytics 4 (GA4) data.

---

## 2\. Intended UI & Visual Architecture

### UI Visualization Mock (current Figma design)

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