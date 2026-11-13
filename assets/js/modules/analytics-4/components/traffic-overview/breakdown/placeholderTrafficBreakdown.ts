/**
 * Placeholder traffic breakdown.
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
 * Internal dependencies
 */
import { TrafficBreakdownValue } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';

/**
 * The values the Traffic Overview PDF prints in each breakdown until it reads
 * the site's own, keyed by the column's `id`. Each column's values are ordered
 * by visits, most first, and the device names are lowercase, the way GA4 writes
 * them.
 *
 * @since n.e.x.t
 */
export const PLACEHOLDER_TRAFFIC_BREAKDOWN: Record<
	string,
	TrafficBreakdownValue[]
> = {
	channels: [
		{ label: 'Direct', visits: 1200 },
		{ label: 'Organic Search', visits: 900 },
		{ label: 'Organic Social', visits: 700 },
		{ label: 'Referral', visits: 400 },
	],
	locations: [
		{ label: 'Singapore', visits: 1100 },
		{ label: 'Brazil', visits: 800 },
		{ label: 'China', visits: 600 },
		{ label: 'United States', visits: 400 },
	],
	devices: [
		{ label: 'desktop', visits: 1800 },
		{ label: 'mobile', visits: 900 },
		{ label: 'tablet', visits: 400 },
	],
};
