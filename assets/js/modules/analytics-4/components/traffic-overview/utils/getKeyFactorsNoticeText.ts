/**
 * Traffic Overview `getKeyFactorsNoticeText` utility.
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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getKeyFactorsWaitingText } from './getKeyFactorsWaitingText';

export interface KeyFactorsNoticeOptions {
	/** Whether the selected date range is too short for the key factors. */
	rangeTooShort: boolean;
	/** Whether the site's recorded traffic doesn't cover the period before the selected date range yet. */
	noPreviousPeriod: boolean;
	/** The last day of the first date range of this length with the key factors, as `YYYY-MM-DD`, or null. */
	keyFactorsAvailableFrom: string | null;
	/** Today, as `YYYY-MM-DD`. */
	referenceDate: string;
	/** Whether no channel changed notably: traffic was steady, or there are neither cards nor a summary. */
	noChange: boolean;
	/** The number of days in the selected date range. */
	daysInSelectedRange: number;
}

/**
 * Gets the text of the notice under the key factors' heading, if it has one.
 *
 * A range too short for the key factors has none, and no summary either, so
 * the notice says what range they need, in place of the cards. Until the
 * site's recorded traffic covers the period before the range, there are none
 * either, so the notice says when they will show, as the scenarios doc agreed
 * (D13). In both cases, "No channel changed notably…" would describe a
 * comparison that wasn't made. Otherwise, the notice says that no channel
 * changed notably: above the cards on a steady period, or in their place when
 * there are no cards and no summary.
 *
 * The dashboard's section and the PDF export print the same notice.
 *
 * @since n.e.x.t
 *
 * @param {Object}      options                         The state of the section.
 * @param {boolean}     options.rangeTooShort           Whether the selected date range is too short for the key factors.
 * @param {boolean}     options.noPreviousPeriod        Whether the site's recorded traffic doesn't cover the period before the selected date range yet.
 * @param {string|null} options.keyFactorsAvailableFrom The last day of the first date range of this length with the key factors, as `YYYY-MM-DD`, or null.
 * @param {string}      options.referenceDate           Today, as `YYYY-MM-DD`.
 * @param {boolean}     options.noChange                Whether no channel changed notably: traffic was steady, or there are neither cards nor a summary.
 * @param {number}      options.daysInSelectedRange     The number of days in the selected date range.
 * @return {string|null} The notice's text, or null when the section has no notice.
 */
export function getKeyFactorsNoticeText( {
	rangeTooShort,
	noPreviousPeriod,
	keyFactorsAvailableFrom,
	referenceDate,
	noChange,
	daysInSelectedRange,
}: KeyFactorsNoticeOptions ): string | null {
	if ( rangeTooShort ) {
		return __(
			'Select a date range of at least 7 days to see which channels changed the most',
			'google-site-kit'
		);
	}

	if ( noPreviousPeriod ) {
		return getKeyFactorsWaitingText(
			keyFactorsAvailableFrom,
			referenceDate
		);
	}

	if ( noChange ) {
		return sprintf(
			/* translators: %d: the number of days in the selected date range, such as "28" */
			_n(
				'No channel changed notably compared with the previous %d day',
				'No channel changed notably compared with the previous %d days',
				daysInSelectedRange,
				'google-site-kit'
			),
			daysInSelectedRange
		);
	}

	return null;
}
