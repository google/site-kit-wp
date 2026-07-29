/**
 * Conversion Insights (Site Goals AI insights) types.
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

/* eslint-disable camelcase -- Field names mirror the service request/response JSON contract. */

/**
 * A single period's metrics for a key event, as sent in the request payload.
 */
export interface ConversionInsightMetrics {
	conversions: number;
	conversion_rate: number;
	sessions: number;
	engagement_rate: number;
}

/**
 * One entry in the request `events` array (`POST /v1/ai/conversion-insights`).
 */
export interface ConversionInsightEventData {
	key_event_name: string;
	month_start_date: string;
	current: ConversionInsightMetrics;
	previous: ConversionInsightMetrics;
	yoy_current_conversions?: number;
	yoy_previous_conversions?: number;
}

/**
 * One entry in the response `insights` array.
 */
export interface ConversionInsight {
	key_event_name: string;
	// Machine-readable scenario key (e.g. `GROWTH_VOL_UP_CR_UP_NOT_SEASONAL`) used
	// by the UI to pick an icon/variant and detect seasonality without parsing text.
	code: string;
	text: string;
	actionable_recommendation: string;
}

/* eslint-enable camelcase */

/**
 * Optional year-over-year conversion counts used for the seasonality signal.
 */
export interface ConversionInsightYoY {
	current: number;
	previous: number;
}
