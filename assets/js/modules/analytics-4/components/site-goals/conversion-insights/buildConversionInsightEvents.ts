/**
 * Conversion Insights request payload builder.
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
import { ConversionInsightEventData, ConversionInsightYoY } from './types';

/* eslint-disable camelcase -- Field names mirror the service request JSON contract. */

/**
 * A single period's metrics in the plugin's camelCase form, before shaping into
 * the snake_case request payload.
 */
export interface ConversionInsightMetricInput {
	conversions: number;
	conversionRate: number;
	sessions: number;
	engagementRate: number;
}

interface BuildConversionInsightEventArgs {
	/** The GA4 key event name to analyze (echoed in the response). */
	keyEventName: string;
	/** First day of the current-period month, `YYYY-MM-DD`. */
	monthStartDate: string;
	/** Current-period metrics. */
	current: ConversionInsightMetricInput;
	/** Previous-period metrics. */
	previous: ConversionInsightMetricInput;
	/** Optional year-over-year conversion counts for the seasonality signal. */
	yoy?: ConversionInsightYoY;
}

/**
 * Shapes one period's metrics from the plugin's camelCase form into the
 * snake_case contract form.
 *
 * @since n.e.x.t
 *
 * @param {Object} metrics Camel-cased period metrics.
 * @return {Object} The snake_cased metrics object.
 */
function toMetrics( metrics: ConversionInsightMetricInput ) {
	return {
		conversions: metrics.conversions,
		conversion_rate: metrics.conversionRate,
		sessions: metrics.sessions,
		engagement_rate: metrics.engagementRate,
	};
}

/**
 * Builds a single `EventData` object for the Conversion Insights request.
 *
 * The metrics are computed client-side (see `preprocess.ts`) and shaped here into
 * the size-bounded JSON the service expects. `yoy_*` fields are optional and
 * omitted when no YoY data is provided.
 *
 * @since n.e.x.t
 *
 * @param {Object} args                Builder arguments.
 * @param {string} args.keyEventName   The GA4 key event name to analyze.
 * @param {string} args.monthStartDate First day of the current-period month, `YYYY-MM-DD`.
 * @param {Object} args.current        Current-period metrics.
 * @param {Object} args.previous       Previous-period metrics.
 * @param {Object} [args.yoy]          Optional year-over-year conversion counts.
 * @return {Object} A single EventData object.
 */
export function buildConversionInsightEvent( {
	keyEventName,
	monthStartDate,
	current,
	previous,
	yoy,
}: BuildConversionInsightEventArgs ): ConversionInsightEventData {
	const event: ConversionInsightEventData = {
		key_event_name: keyEventName,
		month_start_date: monthStartDate,
		current: toMetrics( current ),
		previous: toMetrics( previous ),
	};

	if ( yoy ) {
		event.yoy_current_conversions = yoy.current;
		event.yoy_previous_conversions = yoy.previous;
	}

	return event;
}

/* eslint-enable camelcase */
