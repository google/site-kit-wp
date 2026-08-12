/**
 * Shared PageSpeed report metric extractors for the dashboard and PDF export.
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
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getScoreCategory } from '@/js/modules/pagespeed-insights/util';

// Minimal shape of the PSI API response — only the fields these extractors
// read. The API returns additional fields that are intentionally omitted here.
interface PSIAudit {
	displayValue?: string;
	score?: number;
}

interface PSIMetric {
	percentile: number;
	category?: string;
}

export interface PSIReport {
	lighthouseResult?: {
		audits?: Record< string, PSIAudit >;
	};
	loadingExperience?: {
		metrics?: {
			LARGEST_CONTENTFUL_PAINT_MS?: PSIMetric;
			CUMULATIVE_LAYOUT_SHIFT_SCORE?: PSIMetric;
			INTERACTION_TO_NEXT_PAINT?: PSIMetric;
		};
	};
}

export interface ScoredMetric {
	displayValue: string;
	score: number;
	category: string;
}

export interface LabMetrics {
	largestContentfulPaint: ScoredMetric;
	cumulativeLayoutShift: ScoredMetric;
	totalBlockingTime: ScoredMetric;
}

export interface FieldMetric {
	displayValue: string;
	category: string;
}

// Each field metric is independently optional: CrUX can return any subset of
// LCP / CLS / INP, so consumers gate each metric on its own presence.
export interface FieldMetrics {
	largestContentfulPaint: FieldMetric | null;
	cumulativeLayoutShift: FieldMetric | null;
	interactionToNextPaint: FieldMetric | null;
}

/**
 * Extracts lab metric display values, scores, and score categories from a
 * PageSpeed Insights report's `lighthouseResult.audits` object.
 *
 * @since 1.183.0
 *
 * @param report Raw PSI API response.
 * @return Lab metrics with displayValue, score, and category for each metric.
 */
export function extractLabMetrics( report: PSIReport | null ): LabMetrics {
	const audits = report?.lighthouseResult?.audits;
	const lcp = audits?.[ 'largest-contentful-paint' ];
	const cls = audits?.[ 'cumulative-layout-shift' ];
	const tbt = audits?.[ 'total-blocking-time' ];

	return {
		largestContentfulPaint: {
			displayValue: lcp?.displayValue ?? '0',
			score: lcp?.score ?? 0,
			category: getScoreCategory( lcp?.score ?? 0 ),
		},
		cumulativeLayoutShift: {
			displayValue: cls?.displayValue ?? '0',
			score: cls?.score ?? 0,
			category: getScoreCategory( cls?.score ?? 0 ),
		},
		totalBlockingTime: {
			displayValue: tbt?.displayValue ?? '0',
			score: tbt?.score ?? 0,
			category: getScoreCategory( tbt?.score ?? 0 ),
		},
	};
}

/**
 * Extracts field (CrUX) metric display values and categories from a PageSpeed
 * Insights report's `loadingExperience.metrics` object.
 *
 * Each metric (LCP, CLS, INP) is extracted independently and is `null` when its
 * key is absent — CrUX can return any subset. The function returns `null` only
 * when there is no field data at all.
 *
 * @since 1.183.0
 *
 * @param report Raw PSI API response.
 * @return Field metrics with per-metric values, or null when field data is unavailable.
 */
export function extractFieldMetrics(
	report: PSIReport | null
): FieldMetrics | null {
	const metrics = report?.loadingExperience?.metrics;

	if ( ! metrics ) {
		return null;
	}

	const lcp = metrics.LARGEST_CONTENTFUL_PAINT_MS;
	const cls = metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE;
	const inp = metrics.INTERACTION_TO_NEXT_PAINT;

	return {
		largestContentfulPaint: lcp
			? {
					// LCP percentile is in ms — convert to seconds, one decimal.
					displayValue: sprintf(
						/* translators: %s: number of seconds */
						_x( '%s s', 'duration', 'google-site-kit' ),
						( Math.round( lcp.percentile / 100 ) / 10 ).toFixed( 1 )
					),
					category: lcp.category?.toLowerCase() ?? '',
			  }
			: null,
		cumulativeLayoutShift: cls
			? {
					// CLS percentile is scaled by 100 — back to the 0–1 score.
					displayValue: ( cls.percentile / 100 ).toFixed( 2 ),
					category: cls.category?.toLowerCase() ?? '',
			  }
			: null,
		interactionToNextPaint: inp
			? {
					displayValue: sprintf(
						/* translators: %s: number of milliseconds */
						_x( '%s ms', 'duration', 'google-site-kit' ),
						String( inp.percentile )
					),
					category: inp.category?.toLowerCase() ?? '',
			  }
			: null,
	};
}
