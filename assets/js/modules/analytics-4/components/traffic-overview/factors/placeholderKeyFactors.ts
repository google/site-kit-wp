/**
 * Placeholder key factors.
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
import { BenchmarkingKeyFactor } from '@/js/modules/analytics-4/utils/benchmarking/types';

/**
 * The key factor cards the Traffic Overview panel shows until it reads them
 * from the benchmarking response. They are the cards of the design.
 *
 * @since n.e.x.t
 */
export const PLACEHOLDER_KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{
		kind: 'CHANNEL',
		label: 'Referral',
		current: 245,
		previous: 180,
		sharePct: 52.4,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/Ice-cream-is-good-for-your-health/',
				current: 46,
				previous: 30,
				sharePct: 12.9,
			},
			{
				kind: 'REFERRING_SITE',
				label: 'facebook.com',
				current: 92,
				previous: 60,
				sharePct: 25.8,
			},
		],
	},
	{
		kind: 'CHANNEL',
		label: 'Organic Video',
		current: 168,
		previous: 120,
		sharePct: 38.7,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/Eat-ice-cream-every-day/',
				current: 53,
				previous: 30,
				sharePct: 18.5,
			},
			{
				kind: 'PLATFORM',
				label: 'YouTube',
				current: 72,
				previous: 60,
				sharePct: 9.7,
			},
		],
	},
	{
		kind: 'CHANNEL',
		label: 'Organic Search',
		current: 379,
		previous: 400,
		sharePct: 100,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/best-ice-cream-shops-guide/',
				current: 38,
				previous: 40,
				sharePct: 9.5,
			},
			{
				kind: 'SEARCH_KEYWORD',
				label: 'healthy ice cream types',
				current: 17,
				previous: 20,
				sharePct: 14.3,
			},
		],
	},
];

/**
 * The generated summary of the key factor cards the Traffic Overview panel
 * shows until it reads the summary from the generated insight. It is the
 * summary of the design, and `**` pairs mark the names it highlights.
 *
 * The generated text comes from the insight service in the site's language,
 * so this placeholder is not a translated string either.
 *
 * @since n.e.x.t
 */
export const PLACEHOLDER_KEY_FACTORS_INSIGHT =
	'Referral traffic from **substack.com** is up most. Visits to **“Ice cream is good for your health”** are also up, mainly from the Search query **“healthy ice cream types”**';
