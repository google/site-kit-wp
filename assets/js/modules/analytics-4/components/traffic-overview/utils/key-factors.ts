/**
 * Traffic Overview key factors utilities.
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
import { formatDate, numFmt } from '@/js/util';

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
 * Formats a change in visits with its sign and unit, such as "+65 visits" or
 * "-1 visit".
 *
 * @since n.e.x.t
 *
 * @param {number} change The change in visits, negative for a drop.
 * @return {string} The change with its sign and unit.
 */
export function formatVisitsChange( change: number ): string {
	return sprintf(
		/* translators: %s: a change in visits with its sign, such as "+65" or "-21" */
		_n( '%s visit', '%s visits', Math.abs( change ), 'google-site-kit' ),
		numFmt( change, {
			style: 'decimal',
			signDisplay: 'exceptZero',
			maximumFractionDigits: 0,
		} )
	);
}

/**
 * Formats a change in search clicks with its sign and unit, such as
 * "+65 clicks" or "-1 click".
 *
 * A search keyword's change counts its clicks in Search Console, which are not
 * visits, so it is never shown as visits.
 *
 * @since n.e.x.t
 *
 * @param {number} change The change in clicks, negative for a drop.
 * @return {string} The change with its sign and unit.
 */
export function formatClicksChange( change: number ): string {
	return sprintf(
		/* translators: %s: a change in search clicks with its sign, such as "+65" or "-21" */
		_n( '%s click', '%s clicks', Math.abs( change ), 'google-site-kit' ),
		numFmt( change, {
			style: 'decimal',
			signDisplay: 'exceptZero',
			maximumFractionDigits: 0,
		} )
	);
}

/**
 * Formats a key factor's share of the site's visits, such as "45.2% of all
 * visits", which a card shows on a steady period.
 *
 * @since n.e.x.t
 *
 * @param {number} visitsSharePct The share of the site's visits, in percent, such as `45.2`.
 * @return {string} The share, with one decimal at most.
 */
export function formatVisitsShare( visitsSharePct: number ): string {
	return sprintf(
		/* translators: %s: the share of the site's visits that a channel brought, such as "45.2%" */
		__( '%s of all visits', 'google-site-kit' ),
		numFmt( visitsSharePct / 100, {
			style: 'percent',
			maximumFractionDigits: 1,
		} )
	);
}

/**
 * Gets the text of the notice that says when the key factors will show, while
 * the site's history doesn't cover the period before the selected date range,
 * which they compare it with.
 *
 * The key factors show from the last day of the first date range of this
 * length whose previous period has recorded traffic, `availableFrom`. A range
 * that ends today reaches it on that day, so a later day says when to check
 * back. A day that has passed means the selected range ends in the past,
 * before it, so the notice asks for a range that ends on that day or later.
 * Without the day, the site has no recorded traffic up to the end of the
 * selected range, and the notice says only that there's nothing to compare to.
 *
 * @since n.e.x.t
 *
 * @param {string|null} availableFrom The last day of the first date range of this length with the key factors, as `YYYY-MM-DD`, or null when the site has no recorded traffic up to the end of the selected range.
 * @param {string}      referenceDate Today, as `YYYY-MM-DD`.
 * @return {string} The notice's text.
 */
export function getKeyFactorsWaitingText(
	availableFrom: string | null,
	referenceDate: string
): string {
	if ( ! availableFrom ) {
		return __(
			'There’s no previous period to compare to.',
			'google-site-kit'
		);
	}

	const date = formatDate( availableFrom, { month: 'long' } );

	if ( availableFrom > referenceDate ) {
		return sprintf(
			/* translators: %s: the first day the key factors show, such as "February 6, 2025" */
			__(
				'There’s no previous period to compare to yet. Check back on %s to see which channels changed the most.',
				'google-site-kit'
			),
			date
		);
	}

	return sprintf(
		/* translators: %s: the last day of the first date range of this length with the key factors, such as "February 6, 2025" */
		__(
			'There’s no previous period to compare to. Select a date range that ends on or after %s to see which channels changed the most.',
			'google-site-kit'
		),
		date
	);
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
