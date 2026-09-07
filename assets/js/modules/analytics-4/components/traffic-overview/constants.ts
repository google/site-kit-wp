/**
 * Traffic Overview constants.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The DOM `id` of the Traffic Overview tab. The panel points its
 * `aria-labelledby` at this `id`, so the tab names the panel.
 */
export const TRAFFIC_OVERVIEW_TAB_ID = 'googlesitekit-traffic-overview-tab';

/** The slug the Traffic Overview widget registers under. */
export const TRAFFIC_OVERVIEW_WIDGET_SLUG = 'analyticsTrafficOverview';

/**
 * The most rows a breakdown column shows, counting the trailing "Others" row.
 * It matches the donut chart's `maxSlices`, so the same values stay at the top
 * of a dimension as before.
 */
export const TRAFFIC_BREAKDOWN_MAX_ROWS = 5;
