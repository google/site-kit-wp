/**
 * Hook for a single Site Goals key event's Conversion Insight.
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
import { Select, useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ConversionInsight, ConversionInsightEventData } from './types';

interface UseConversionInsightResult {
	/** The insight, `null` when resolved with no match, or `undefined` while loading. */
	insight: ConversionInsight | null | undefined;
	/** Whether the insight request is still resolving. */
	isLoading: boolean;
	/** The request error, if any. */
	error: unknown;
}

/**
 * Requests the batch Conversion Insight for the given events payload and returns
 * the insight for a single key event, plus its loading/error state.
 *
 * @since n.e.x.t
 *
 * @param {Object[]|null} events       The assembled request payload, or `null` when not ready.
 * @param {string}        keyEventName The key event whose insight to return.
 * @return {Object} `{ insight, isLoading, error }`.
 */
export function useConversionInsight(
	events: ConversionInsightEventData[] | null,
	keyEventName?: string
): UseConversionInsightResult {
	const insight = useSelect(
		( select: Select ) =>
			events && keyEventName
				? select( MODULES_ANALYTICS_4 ).getConversionInsight(
						events,
						keyEventName
				  )
				: undefined,
		[ events, keyEventName ]
	) as ConversionInsight | null | undefined;

	const isLoading = useSelect(
		( select: Select ) =>
			events
				? select( MODULES_ANALYTICS_4 ).isLoadingConversionInsights(
						events
				  )
				: false,
		[ events ]
	) as boolean;

	const error = useSelect(
		( select: Select ) =>
			events
				? select( MODULES_ANALYTICS_4 ).getConversionInsightsError(
						events
				  )
				: undefined,
		[ events ]
	);

	return { insight, isLoading, error };
}
