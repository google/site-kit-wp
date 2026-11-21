/**
 * Traffic Overview `getTypicalTrafficPDFData` utility.
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
import { getKeyFactorName } from '@/js/modules/analytics-4/components/traffic-overview/factors/getKeyFactorName';
import { getKeyFactorsNoticeText } from '@/js/modules/analytics-4/components/traffic-overview/utils/getKeyFactorsNoticeText';
import { getTypicalTrafficAvailability } from '@/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficAvailability';
import { getTypicalTrafficRangeWaitingText } from '@/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficRangeWaitingText';
import {
	BenchmarkingInsight,
	BenchmarkingKeyFactor,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';

/** A key factor card, as the PDF prints it. */
export interface TrafficOverviewPDFKeyFactor {
	/** The card's name, as the dashboard's card shows it. */
	name: string;
	/** The change in visits, negative for a drop. */
	change: number;
	/** The share of the site's visits, in percent, which a card shows on a steady period. */
	visitsSharePct?: number;
}

/** The parts of the typical traffic view the PDF prints. */
export interface TrafficOverviewTypicalTrafficPDFData {
	/** The number of days in the date range, which the key factors' heading names. */
	daysInRange: number;
	/** The generated sentence that compares the visits with their typical range, or null when the PDF prints none. */
	analysis: string | null;
	/** The text that says when the typical traffic range will show, while the chart has no band, or null. */
	bandNotice: string | null;
	/** The generated summary of the key factors, or null when the PDF prints none. */
	driver: string | null;
	/** The notice under the key factors' heading, or null when the section has none. */
	keyFactorsNotice: string | null;
	/** The key factor cards, in the order to print them. */
	keyFactors: TrafficOverviewPDFKeyFactor[];
}

export interface TypicalTrafficPDFDataOptions {
	/** The benchmarking response for the date range. */
	benchmarkingResponse: DecodedBenchmarkingResponse;
	/** The generated insight the dashboard has for the date range, or null when it has none. */
	insight: BenchmarkingInsight | null;
	/** Today, as `YYYY-MM-DD`. */
	referenceDate: string;
	/** The site's URL, which a landing page's path is resolved against. */
	referenceSiteURL?: string;
	/** The number of days in the date range. */
	daysInRange: number;
}

/**
 * Gets the parts of the typical traffic view that the PDF prints, the way the
 * dashboard's panel shows them.
 *
 * The cards, their notice and the waiting text follow the availability of the
 * benchmarking response, as `TrafficOverviewPanel` does: the analysis prints
 * only where the chart draws the band, and the band's waiting text in its
 * place. The insight prints only where the panel would ask for it, so a
 * leftover insight never describes figures the PDF doesn't print.
 *
 * @since n.e.x.t
 *
 * @param {Object}      options                      The response, the insight and the date range.
 * @param {Object}      options.benchmarkingResponse The benchmarking response for the date range.
 * @param {Object|null} options.insight              The generated insight the dashboard has for the date range, or null.
 * @param {string}      options.referenceDate        Today, as `YYYY-MM-DD`.
 * @param {string}      [options.referenceSiteURL]   Optional. The site's URL, which a landing page's path is resolved against.
 * @param {number}      options.daysInRange          The number of days in the date range.
 * @return {Object} The parts of the typical traffic view to print.
 */
export function getTypicalTrafficPDFData( {
	benchmarkingResponse,
	insight,
	referenceDate,
	referenceSiteURL,
	daysInRange,
}: TypicalTrafficPDFDataOptions ): TrafficOverviewTypicalTrafficPDFData {
	const {
		rangeTooShort,
		bandAvailable,
		bandAvailableFrom,
		keyFactorsAvailable,
		keyFactorsAvailableFrom,
		insightRequestAllowed,
		performanceInsightAvailable,
	} = getTypicalTrafficAvailability( benchmarkingResponse );

	const { steadyTraffic } = benchmarkingResponse;

	// A card without a name has nothing to name, so it is left out, as on the
	// dashboard.
	const keyFactors = benchmarkingResponse.keyFactors
		.filter(
			(
				keyFactor
			): keyFactor is BenchmarkingKeyFactor & { label: string } =>
				!! keyFactor.label
		)
		.map( ( { kind, label, current, previous, sharePct } ) => ( {
			name: getKeyFactorName( kind, label, referenceSiteURL ),
			change: current - previous,
			// On a steady period, a card's share is of the site's visits,
			// which is why it shows.
			visitsSharePct: steadyTraffic ? sharePct : undefined,
		} ) );

	const requestedInsight = insightRequestAllowed ? insight : null;
	const driver = requestedInsight?.driver || null;

	return {
		daysInRange,
		analysis:
			( performanceInsightAvailable && requestedInsight?.analysis ) ||
			null,
		bandNotice: bandAvailable
			? null
			: getTypicalTrafficRangeWaitingText(
					bandAvailableFrom,
					referenceDate
			  ),
		driver,
		keyFactorsNotice: getKeyFactorsNoticeText( {
			rangeTooShort,
			noPreviousPeriod: ! rangeTooShort && ! keyFactorsAvailable,
			keyFactorsAvailableFrom,
			referenceDate,
			noChange: steadyTraffic || ( keyFactors.length === 0 && ! driver ),
			daysInSelectedRange: daysInRange,
		} ),
		keyFactors,
	};
}
