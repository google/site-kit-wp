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
import {
	BenchmarkingKeyFactor,
	BenchmarkingKeyFactorAttribute,
	BenchmarkingKeyFactorKind,
	BenchmarkingKeyFactorParentChannel,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { numFmt } from '@/js/util';

/**
 * The share, in percent, from which a part reads as all of its whole's change.
 * Shares travel rounded to one decimal, so this is a share that rounds to
 * 100%, as the Site Kit service renders it.
 */
const ALL_OF_THE_CHANGE_PERCENT = 99.5;

export interface KeyFactorsNoticeOptions {
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
		formatSharePercent( visitsSharePct )
	);
}

/**
 * Formats a share in percent with one decimal at most, such as "73.3%".
 *
 * @since n.e.x.t
 *
 * @param {number} sharePct The share, in percent, such as `73.3`.
 * @return {string} The share.
 */
function formatSharePercent( sharePct: number ): string {
	return numFmt( sharePct / 100, {
		style: 'percent',
		maximumFractionDigits: 1,
	} );
}

/**
 * Formats the share of a card that took its channel's place, such as a post or
 * a referring site that carried most of its channel's change: "73.3% of
 * Referral’s +300 visits", or "All of Referral’s +300 visits" from 99.5%.
 *
 * @since n.e.x.t
 *
 * @param {number} sharePct             The card's share of its channel's change, in percent, such as `73.3`.
 * @param {Object} parentChannel        The channel.
 * @param {string} parentChannel.label  The channel's name, such as "Referral".
 * @param {number} parentChannel.change The channel's change in visits, negative for a drop.
 * @return {string} The share, naming the channel and its change.
 */
export function formatParentChannelShare(
	sharePct: number,
	{ label, change }: BenchmarkingKeyFactorParentChannel
): string {
	const channelChange = formatVisitsChange( change );

	if ( sharePct >= ALL_OF_THE_CHANGE_PERCENT ) {
		return sprintf(
			/* translators: 1: the name of a traffic channel, such as "Referral", 2: the channel's change in visits, such as "+300 visits" */
			__( 'All of %1$s’s %2$s', 'google-site-kit' ),
			label,
			channelChange
		);
	}

	return sprintf(
		/* translators: 1: a share of a channel's change, such as "73.3%", 2: the name of the traffic channel, such as "Referral", 3: the channel's change in visits, such as "+300 visits" */
		__( '%1$s of %2$s’s %3$s', 'google-site-kit' ),
		formatSharePercent( sharePct ),
		label,
		channelChange
	);
}

/**
 * Gets the line a key factor card shows under its title, which says what its
 * change is a share of, if it shows one.
 *
 * On a steady period, the card is a channel with its share of the site's
 * visits, which is why it shows. A card that took its channel's place, such as
 * a post or a referring site, names the channel and its change, so the reader
 * sees where the card's change came from. Any other card shows its change
 * alone.
 *
 * The dashboard's card and the PDF export show the same line.
 *
 * @since n.e.x.t
 *
 * @param {Object}  keyFactor               The card.
 * @param {number}  keyFactor.sharePct      The card's share, in percent.
 * @param {Object}  keyFactor.parentChannel The channel the card took the place of, or `undefined`.
 * @param {Object}  options                 The state of the section.
 * @param {boolean} options.steady          Whether traffic was steady.
 * @return {string|null} The line, or null when the card shows none.
 */
export function getKeyFactorShareText(
	{
		sharePct,
		parentChannel,
	}: Pick< BenchmarkingKeyFactor, 'sharePct' | 'parentChannel' >,
	{ steady }: { steady: boolean }
): string | null {
	if ( steady ) {
		return formatVisitsShare( sharePct );
	}

	if ( parentChannel ) {
		return formatParentChannelShare( sharePct, parentChannel );
	}

	return null;
}

/**
 * Gets the line an attribute of a key factor card shows under its change,
 * which says what the change is a share of, as the Site Kit service renders
 * the card's rows (§5.10 *Rendering*).
 *
 * - A search keyword's change in clicks is a share of all of the site's
 *   search clicks, worded as a change, so it doesn't read as the keyword's
 *   own share of the clicks.
 * - A channel of the paid group is a share of the paid channels' movement in
 *   both directions, rather than of the group's net change.
 * - An attribute that moved further than its card, the same way, is more
 *   than the card's net change, since the card's other parts moved the other
 *   way. It has no share, and never reads as a share above 100%.
 * - Any other attribute with a share is a share of its card's change, and all
 *   of it from 99.5%.
 *
 * An attribute without a share, such as the side of a net that moved against
 * its card, shows its change alone.
 *
 * @since n.e.x.t
 *
 * @param {string}  cardKind            The kind of the attribute's card, such as `CHANNEL_GROUP`.
 * @param {Object}  attribute           The attribute.
 * @param {string}  attribute.kind      The attribute's kind, such as `SEARCH_KEYWORD`.
 * @param {number}  attribute.sharePct  The attribute's share, in percent, or `0` without one.
 * @param {boolean} attribute.oversized Whether the attribute moved further than its card, the same way.
 * @return {string|null} The line, or null when the attribute shows none.
 */
export function getKeyFactorAttributeShareText(
	cardKind: BenchmarkingKeyFactorKind,
	{
		kind,
		sharePct,
		oversized,
	}: Pick< BenchmarkingKeyFactorAttribute, 'kind' | 'sharePct' | 'oversized' >
): string | null {
	if ( kind === 'SEARCH_KEYWORD' ) {
		// A share that rounds to `0` is under 0.05% of the site's clicks.
		return sharePct > 0
			? sprintf(
					/* translators: %s: a search keyword's change in clicks as a share of all of the site's search clicks, such as "3.6%" */
					__(
						'A change equal to %s of the site’s search clicks',
						'google-site-kit'
					),
					formatSharePercent( sharePct )
			  )
			: sprintf(
					/* translators: %s: the smallest share shown, "0.1%" */
					__(
						'A change equal to less than %s of the site’s search clicks',
						'google-site-kit'
					),
					formatSharePercent( 0.1 )
			  );
	}

	if ( cardKind === 'CHANNEL_GROUP' ) {
		return sharePct > 0
			? sprintf(
					/* translators: %s: a paid channel's change as a share of the paid channels' movement in both directions, such as "65.6%" */
					__( '%s of paid traffic’s movement', 'google-site-kit' ),
					formatSharePercent( sharePct )
			  )
			: null;
	}

	if ( oversized ) {
		return __( 'More than the channel’s net change', 'google-site-kit' );
	}

	if ( sharePct >= ALL_OF_THE_CHANGE_PERCENT ) {
		return __( 'All of the change', 'google-site-kit' );
	}

	if ( sharePct > 0 ) {
		return sprintf(
			/* translators: %s: a part's change as a share of its card's change, such as "75%" */
			__( '%s of the change', 'google-site-kit' ),
			formatSharePercent( sharePct )
		);
	}

	return null;
}

/**
 * Gets the text of the notice under the key factors' heading, if it has one.
 *
 * The notice says that no channel changed notably: above the cards on a
 * steady period, or in their place when there are no cards and no summary.
 * The section shows only for a range with key factors, so it never says what
 * a range too short or too new for them lacks. The notice at the top of the
 * panel says that, `getTypicalTrafficAvailabilityText()`, since "No channel
 * changed notably…" would describe a comparison that wasn't made.
 *
 * The dashboard's section and the PDF export print the same notice.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options                     The state of the section.
 * @param {boolean} options.noChange            Whether no channel changed notably: traffic was steady, or there are neither cards nor a summary.
 * @param {number}  options.daysInSelectedRange The number of days in the selected date range.
 * @return {string|null} The notice's text, or null when the section has no notice.
 */
export function getKeyFactorsNoticeText( {
	noChange,
	daysInSelectedRange,
}: KeyFactorsNoticeOptions ): string | null {
	if ( ! noChange ) {
		return null;
	}

	return sprintf(
		/* translators: %d: the number of days in the selected date range, such as "28" */
		_n(
			'No channel changed notably compared with the previous %d day.',
			'No channel changed notably compared with the previous %d days.',
			daysInSelectedRange,
			'google-site-kit'
		),
		daysInSelectedRange
	);
}
