/**
 * Hook that fetches and preprocesses the Conversion Insights request payload.
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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	assembleConversionInsightEvents,
	buildConversionInsightReportOptions,
	getConversionInsightDateRanges,
} from './preprocess';
import { ConversionInsightEventData } from './types';

interface UseConversionInsightEventsResult {
	/** The assembled request payload, or `null` while reports are loading. */
	events: ConversionInsightEventData[] | null;
	/** Whether any of the underlying reports are still resolving. */
	isLoading: boolean;
	/** The first report error, if any. */
	error: unknown;
}

/**
 * Fetches the GA4 reports for the given key events (over calendar-month windows)
 * and assembles the Conversion Insights request payload entirely on the client.
 *
 * Each report is a standard cacheable `getReport` request, so repeat page loads
 * reuse the client-side cache independently of the service-side cache.
 *
 * @since n.e.x.t
 *
 * @param {string[]} keyEventNames The GA4 key event names to analyze.
 * @return {Object} `{ events, isLoading, error }`.
 */
export function useConversionInsightEvents(
	keyEventNames: string[]
): UseConversionInsightEventsResult {
	const referenceDate = useSelect(
		( select: Select ) => select( CORE_USER ).getReferenceDate(),
		[]
	) as string | undefined;

	const namesKey = keyEventNames.join( '|' );

	const reportOptions = useMemo( () => {
		if ( ! referenceDate || ! keyEventNames.length ) {
			return null;
		}

		return buildConversionInsightReportOptions(
			getConversionInsightDateRanges( referenceDate ),
			keyEventNames
		);
		// `keyEventNames` is captured via the stable `namesKey` join.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ referenceDate, namesKey ] );

	const siteWideReport = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport(
						reportOptions.siteWideOptions
				  )
				: undefined,
		[ reportOptions ]
	);

	const eventReport = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport(
						reportOptions.eventOptions
				  )
				: undefined,
		[ reportOptions ]
	);

	const yoyReport = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport(
						reportOptions.yoyOptions
				  )
				: undefined,
		[ reportOptions ]
	);

	const [ isLoading, error ] = useSelect(
		( select: Select ) => {
			if ( ! reportOptions ) {
				return [ false, undefined ];
			}

			const options = [
				reportOptions.siteWideOptions,
				reportOptions.eventOptions,
				reportOptions.yoyOptions,
			];

			return [
				select( MODULES_ANALYTICS_4 ).areReportsLoading( ...options ),
				select( MODULES_ANALYTICS_4 ).getFirstReportError( ...options ),
			];
		},
		[ reportOptions ]
	) as [ boolean, unknown ];

	const events = useMemo( () => {
		if ( ! referenceDate ) {
			return null;
		}

		return assembleConversionInsightEvents( referenceDate, keyEventNames, {
			siteWideReport,
			eventReport,
			yoyReport,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ referenceDate, namesKey, siteWideReport, eventReport, yoyReport ] );

	return { events, isLoading, error };
}
