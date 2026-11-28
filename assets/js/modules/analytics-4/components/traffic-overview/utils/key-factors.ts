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
	BenchmarkingKeyFactorAttributeKind,
	BenchmarkingKeyFactorKind,
	BenchmarkingKeyFactorParentChannel,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { numFmt } from '@/js/util';
import { untrailingslashit } from '@/js/util/sanitize';
import { getPageURL } from './report';

/**
 * The share, in percent, from which a part reads as all of its whole's change.
 * Shares travel rounded to one decimal, so this is a share that rounds to
 * 100%, as the Site Kit service renders it.
 */
const ALL_OF_THE_CHANGE_PERCENT = 99.5;

/**
 * The title a key factor card shows above each kind of attribute, such as
 * "Landing page" above a page path.
 *
 * `REFERRING_SITE`, `PLATFORM` and `ASSISTANT` are all the session's source.
 * A paid or video card calls it a platform, an `AI Assistant` card an AI
 * assistant, and any other card a referring site.
 *
 * @since n.e.x.t
 */
export const KEY_FACTOR_ATTRIBUTE_TITLES: Record<
	BenchmarkingKeyFactorAttributeKind,
	string
> = {
	TRAFFIC_CHANNEL: __( 'Traffic channel', 'google-site-kit' ),
	LANDING_PAGE: __( 'Landing page', 'google-site-kit' ),
	SEARCH_KEYWORD: __( 'Search keyword', 'google-site-kit' ),
	REFERRING_SITE: __( 'Referring site', 'google-site-kit' ),
	PLATFORM: __( 'Platform', 'google-site-kit' ),
	CAMPAIGN: __( 'Campaign', 'google-site-kit' ),
	DEVICE: __( 'Device', 'google-site-kit' ),
	USER_TYPE: __( 'Visitor type', 'google-site-kit' ),
	ASSISTANT: __( 'AI assistant', 'google-site-kit' ),
};

/**
 * The generated summary of the key factor cards the Traffic Overview panel
 * shows until it reads the summary from the generated insight. It is the
 * summary of the design, and `**` pairs mark the names it highlights.
 *
 * The generated text comes from the insight service in the site's language,
 * so this placeholder is not a translated string.
 *
 * @since n.e.x.t
 */
export const PLACEHOLDER_KEY_FACTORS_INSIGHT =
	'Referral traffic from **substack.com** is up most. Visits to **“Ice cream is good for your health”** are also up, mainly from the Search query **“healthy ice cream types”**';

export interface KeyFactorsNoticeOptions {
	/** Whether no channel changed notably: traffic was steady, or there are neither cards nor a summary. */
	noChange: boolean;
	/** The number of days in the selected date range. */
	daysInSelectedRange: number;
}

/** The card of an attribute, as the attribute's line reads it. */
export interface KeyFactorAttributeCard {
	/** The card's kind, such as `CHANNEL_GROUP`. */
	kind: BenchmarkingKeyFactorKind;
	/** The card's change in visits, negative for a drop, against which an attribute's other parts moved. */
	change: number;
}

/** An attribute of a key factor card that has a value to name. */
export type NamedKeyFactorAttribute = BenchmarkingKeyFactorAttribute & {
	label: string;
};

/** A row a key factor card lists under "Top changes". */
export interface KeyFactorRow {
	/** The attribute the row shows. */
	attribute: NamedKeyFactorAttribute;
	/** The name the row shows for the attribute's value, as `getKeyFactorAttributeName()` gives it. */
	name: string;
	/**
	 * The line under the row's change: what the change is a share of, as
	 * `getKeyFactorAttributeShareText()` gives it, or, on the first side of a
	 * net, the second side that partly offset it. Null when the row shows its
	 * change alone.
	 */
	shareText: string | null;
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
 * Gets the name a traffic channel shows, as a card's title, as an attribute,
 * or in the line of a card that took the channel's place.
 *
 * A channel shows the name Analytics gives it, such as "Organic Search", but
 * the names the plugin and the Site Kit service give are translated: "Paid
 * traffic", the paid channels as one group, and "Cross-network ads" and
 * "Uncategorized traffic", the service's names for Analytics' `Cross-network`
 * and `Unassigned` channels. Analytics' own names for those two, and the other
 * names the service reads them by, show the same way, since a response cached
 * before the plugin renamed them can carry them.
 *
 * @since n.e.x.t
 *
 * @param {string} label The channel's name in the response, such as `Cross-network ads`.
 * @return {string} The name to show.
 */
export function getChannelName( label: string ): string {
	switch ( label.trim().toLowerCase() ) {
		case 'paid traffic':
			return __( 'Paid traffic', 'google-site-kit' );
		case 'cross-network':
		case 'cross-network ads':
		case 'multi-platform ads':
			return __( 'Cross-network ads', 'google-site-kit' );
		case 'unassigned':
		case 'uncategorized traffic':
			return __( 'Uncategorized traffic', 'google-site-kit' );
		default:
			return label;
	}
}

/**
 * Checks whether a landing page is the site's homepage: the page at the site's
 * URL, such as `/` for a site at the root of its domain, or `/blog/` for a site
 * that lives under a folder.
 *
 * @since n.e.x.t
 *
 * @param {string} pagePath The landing page's path, such as `/blog/`.
 * @param {string} siteURL  The site's URL, such as `https://example.com/blog`.
 * @return {boolean} Whether the page is the site's homepage.
 */
function isHomepage( pagePath: string, siteURL: string ): boolean {
	// A value that isn't a path on the site, such as the spam path
	// `//example.org/`, has no URL, so it is never the homepage.
	const pageURL = getPageURL( siteURL, pagePath );

	if ( ! pageURL ) {
		return false;
	}

	const { pathname, search } = new URL( pageURL );

	// A query names another page at the same path, such as `/?p=12` for a post
	// on a site with plain permalinks. Trailing slashes are left out of both
	// paths, so `/blog/` matches a site URL that ends in `/blog`, and `/`
	// matches a site URL without a path.
	return (
		! search &&
		untrailingslashit( pathname ) ===
			untrailingslashit( new URL( siteURL ).pathname )
	);
}

/**
 * Gets the name a key factor shows for a landing page.
 *
 * The site's homepage is named "Homepage", since its path tells a reader
 * little, and any other page is named by its path. Without the site's URL, the
 * homepage is taken to be at `/`, where most sites have it.
 *
 * @since n.e.x.t
 *
 * @param {string} pagePath  The landing page's path, such as `/hello-world/`.
 * @param {string} [siteURL] Optional. The site's URL, such as `https://example.com`.
 * @return {string} The name to show for the page.
 */
export function getLandingPageLabel(
	pagePath: string,
	siteURL?: string
): string {
	const isSiteHomepage = siteURL
		? isHomepage( pagePath, siteURL )
		: pagePath === '/';

	return isSiteHomepage ? __( 'Homepage', 'google-site-kit' ) : pagePath;
}

/**
 * Gets the name of the driver behind a key factor card's change.
 *
 * @since n.e.x.t
 *
 * @param {string} kind               The driver's kind, such as `CONTENT` for a landing page.
 * @param {string} label              The driver's name, such as `Referral`, or the landing page's path.
 * @param {string} [referenceSiteURL] Optional. The site's URL, which a landing page's path is resolved against.
 * @return {string} The driver's name.
 */
function getDriverName(
	kind: BenchmarkingKeyFactorKind,
	label: string,
	referenceSiteURL?: string
): string {
	switch ( kind ) {
		case 'CONTENT':
			return getLandingPageLabel( label, referenceSiteURL );
		case 'CHANNEL':
			return getChannelName( label );
		case 'CHANNEL_GROUP':
			return __( 'Paid traffic', 'google-site-kit' );
		default:
			return label;
	}
}

/**
 * Gets the name a key factor card shows.
 *
 * A landing page's card names the site's homepage "Homepage", as its landing
 * page attributes do. A channel's card shows the channel's name as
 * `getChannelName()` gives it, which translates the names of the plugin and
 * the Site Kit service, and the group of the paid channels is always "Paid
 * traffic". Any other card shows its label as the response has it.
 *
 * After a page that brought visits from several channels took a card of its
 * own, a channel's card, or the paid channels', is for the channel's other
 * pages, and reads "Direct (other pages)", for example.
 *
 * The dashboard's card and the PDF export name a card the same way.
 *
 * @since n.e.x.t
 *
 * @param {Object}  keyFactor              The card.
 * @param {string}  keyFactor.kind         The driver's kind, such as `CONTENT` for a landing page.
 * @param {string}  keyFactor.label        The driver's name, such as `Referral`, or the landing page's path.
 * @param {boolean} [keyFactor.otherPages] Optional. Whether the card is for its channel's other pages.
 * @param {string}  [referenceSiteURL]     Optional. The site's URL, which a landing page's path is resolved against.
 * @return {string} The card's name.
 */
export function getKeyFactorName(
	{
		kind,
		label,
		otherPages = false,
	}: Pick< BenchmarkingKeyFactor, 'kind' | 'otherPages' > & { label: string },
	referenceSiteURL?: string
): string {
	const name = getDriverName( kind, label, referenceSiteURL );

	if ( ! otherPages ) {
		return name;
	}

	return sprintf(
		/* translators: %s: the name of a traffic channel, such as "Direct", whose card is for its pages other than a page that took a card of its own */
		__( '%s (other pages)', 'google-site-kit' ),
		name
	);
}

/**
 * Gets the name an attribute of a key factor card shows for its value.
 *
 * A landing page shows the page's title when the response has one, and
 * otherwise "Homepage" for the site's homepage or the page's path. Either way,
 * it links to the page by its path. A traffic channel shows its name as
 * `getChannelName()` gives it. Any other attribute shows its value as the
 * response has it.
 *
 * @since n.e.x.t
 *
 * @param {Object} attribute          The attribute.
 * @param {string} attribute.kind     The attribute's kind, such as `LANDING_PAGE`.
 * @param {string} attribute.label    The attribute's value, such as a page path.
 * @param {string} [attribute.title]  Optional. The page's title, for a landing page.
 * @param {string} [referenceSiteURL] Optional. The site's URL, which a landing page's path is resolved against.
 * @return {string} The name to show.
 */
export function getKeyFactorAttributeName(
	{
		kind,
		label,
		title,
	}: Pick< BenchmarkingKeyFactorAttribute, 'kind' | 'title' > & {
		label: string;
	},
	referenceSiteURL?: string
): string {
	switch ( kind ) {
		case 'LANDING_PAGE':
			return title || getLandingPageLabel( label, referenceSiteURL );
		case 'TRAFFIC_CHANNEL':
			return getChannelName( label );
		default:
			return label;
	}
}

/**
 * Checks whether a name takes a bare apostrophe for its possessive, as an
 * English name that ends in "s" does: "Cross-network ads’ +300 visits", as
 * the Site Kit service writes it.
 *
 * @since n.e.x.t
 *
 * @param {string} name The name, such as "Cross-network ads".
 * @return {boolean} Whether the name ends in "s".
 */
function takesBareApostrophe( name: string ): boolean {
	return /s$/i.test( name );
}

/**
 * Formats the share of a card that took its channel's place, such as a post or
 * a referring site that carried most of its channel's change: "73.3% of
 * Referral’s +300 visits", or "All of Referral’s +300 visits" from 99.5%. A
 * channel whose name ends in "s" takes a bare apostrophe: "All of
 * Cross-network ads’ +300 visits".
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
	const channelName = getChannelName( label );
	const channelChange = formatVisitsChange( change );
	const bareApostrophe = takesBareApostrophe( channelName );

	if ( sharePct >= ALL_OF_THE_CHANGE_PERCENT ) {
		return bareApostrophe
			? sprintf(
					/* translators: Used when the channel's name ends in "s", which takes a bare apostrophe in English. 1: the name of a traffic channel, such as "Cross-network ads", 2: the channel's change in visits, such as "+300 visits" */
					__( 'All of %1$s’ %2$s', 'google-site-kit' ),
					channelName,
					channelChange
			  )
			: sprintf(
					/* translators: 1: the name of a traffic channel, such as "Referral", 2: the channel's change in visits, such as "+300 visits" */
					__( 'All of %1$s’s %2$s', 'google-site-kit' ),
					channelName,
					channelChange
			  );
	}

	return bareApostrophe
		? sprintf(
				/* translators: Used when the channel's name ends in "s", which takes a bare apostrophe in English. 1: a share of a channel's change, such as "73.3%", 2: the name of the traffic channel, such as "Cross-network ads", 3: the channel's change in visits, such as "+300 visits" */
				__( '%1$s of %2$s’ %3$s', 'google-site-kit' ),
				formatSharePercent( sharePct ),
				channelName,
				channelChange
		  )
		: sprintf(
				/* translators: 1: a share of a channel's change, such as "73.3%", 2: the name of the traffic channel, such as "Referral", 3: the channel's change in visits, such as "+300 visits" */
				__( '%1$s of %2$s’s %3$s', 'google-site-kit' ),
				formatSharePercent( sharePct ),
				channelName,
				channelChange
		  );
}

/**
 * Formats the line of a card that took its channel's place though it moved
 * further than the channel, because the channel's other parts moved the other
 * way: "More than Referral’s net change of +300 visits". The card's share is
 * then of something else, or there is none on a period whose total didn't
 * change notably, so the line names the channel and its change without a
 * share. A channel whose name ends in "s" takes a bare apostrophe.
 *
 * @since n.e.x.t
 *
 * @param {Object} parentChannel        The channel.
 * @param {string} parentChannel.label  The channel's name, such as "Referral".
 * @param {number} parentChannel.change The channel's change in visits, negative for a drop.
 * @return {string} The line, naming the channel and its change.
 */
export function formatParentChannelOverrun( {
	label,
	change,
}: BenchmarkingKeyFactorParentChannel ): string {
	const channelName = getChannelName( label );
	const channelChange = formatVisitsChange( change );

	return takesBareApostrophe( channelName )
		? sprintf(
				/* translators: Used when the channel's name ends in "s", which takes a bare apostrophe in English. 1: the name of a traffic channel, such as "Cross-network ads", 2: the channel's change in visits, such as "+300 visits" */
				__( 'More than %1$s’ net change of %2$s', 'google-site-kit' ),
				channelName,
				channelChange
		  )
		: sprintf(
				/* translators: 1: the name of a traffic channel, such as "Referral", 2: the channel's change in visits, such as "+300 visits" */
				__( 'More than %1$s’s net change of %2$s', 'google-site-kit' ),
				channelName,
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
 * sees where the card's change came from: with its share of the channel's
 * change on `PARENT_CHANNEL`, and as more than the channel's change on any
 * other basis or without one, since it then moved further than the channel.
 * Any other card shows its change alone: its share of the site's change, on
 * `GROSS_CHANGE`, `NET_CHANGE` or `SITE_TRAFFIC`, has no design yet.
 *
 * The dashboard's card and the PDF export show the same line.
 *
 * @since n.e.x.t
 *
 * @param {Object}  keyFactor               The card.
 * @param {number}  keyFactor.sharePct      The card's share, in percent.
 * @param {string}  keyFactor.shareBasis    What the card's share is of, such as `PARENT_CHANNEL`, or `undefined` without a basis.
 * @param {Object}  keyFactor.parentChannel The channel the card took the place of, or `undefined`.
 * @param {Object}  options                 The state of the section.
 * @param {boolean} options.steady          Whether traffic was steady.
 * @return {string|null} The line, or null when the card shows none.
 */
export function getKeyFactorShareText(
	{
		sharePct,
		shareBasis,
		parentChannel,
	}: Pick<
		BenchmarkingKeyFactor,
		'sharePct' | 'shareBasis' | 'parentChannel'
	>,
	{ steady }: { steady: boolean }
): string | null {
	if ( steady ) {
		return formatVisitsShare( sharePct );
	}

	if ( ! parentChannel ) {
		return null;
	}

	return shareBasis === 'PARENT_CHANNEL'
		? formatParentChannelShare( sharePct, parentChannel )
		: formatParentChannelOverrun( parentChannel );
}

/**
 * Gets the two lines an attribute that moved further than its card, the same
 * way, can show, which say that the card's other parts of the attribute's kind
 * moved the other way, as the Site Kit service words it: "While other pages
 * fell" under a page that rose further than its card, for example. The other
 * parts of a visitor type are the other visitor type, and those of a referring
 * site, a platform or an AI assistant are the card's other sources.
 *
 * @since n.e.x.t
 *
 * @param {string}      kind  The attribute's kind, such as `LANDING_PAGE`.
 * @param {string|null} label The attribute's value, such as `new` for a visitor type.
 * @return {Array<string>} The line under a card that rose, whose other parts fell, then the line under a card that fell.
 */
function getOversizedAttributeLines(
	kind: BenchmarkingKeyFactorAttributeKind,
	label: string | null
): [ string, string ] {
	switch ( kind ) {
		case 'LANDING_PAGE':
			return [
				__( 'While other pages fell', 'google-site-kit' ),
				__( 'While other pages rose', 'google-site-kit' ),
			];
		case 'CAMPAIGN':
			return [
				__( 'While other campaigns fell', 'google-site-kit' ),
				__( 'While other campaigns rose', 'google-site-kit' ),
			];
		case 'DEVICE':
			return [
				__( 'While other devices fell', 'google-site-kit' ),
				__( 'While other devices rose', 'google-site-kit' ),
			];
		case 'USER_TYPE':
			// Every figure counts visits, never visitors, as the Site Kit
			// service names a visitor type's visits.
			return label?.toLowerCase() === 'new'
				? [
						__(
							'While returning-visitor visits fell',
							'google-site-kit'
						),
						__(
							'While returning-visitor visits rose',
							'google-site-kit'
						),
				  ]
				: [
						__(
							'While new-visitor visits fell',
							'google-site-kit'
						),
						__(
							'While new-visitor visits rose',
							'google-site-kit'
						),
				  ];
		case 'TRAFFIC_CHANNEL':
			return [
				__( 'While other channels fell', 'google-site-kit' ),
				__( 'While other channels rose', 'google-site-kit' ),
			];
		case 'SEARCH_KEYWORD':
			return [
				__( 'While other queries fell', 'google-site-kit' ),
				__( 'While other queries rose', 'google-site-kit' ),
			];
		default:
			return [
				__( 'While other sources fell', 'google-site-kit' ),
				__( 'While other sources rose', 'google-site-kit' ),
			];
	}
}

/**
 * Gets the line of an attribute that moved further than its card, the same
 * way, as `getOversizedAttributeLines()` words it for the card's direction.
 *
 * The other parts moved against the card, which the Site Kit service takes to
 * have risen when its visits didn't change.
 *
 * @since n.e.x.t
 *
 * @param {string}      kind       The attribute's kind, such as `LANDING_PAGE`.
 * @param {string|null} label      The attribute's value, such as `new` for a visitor type.
 * @param {number}      cardChange The card's change in visits, negative for a drop.
 * @return {string} The line.
 */
function getOversizedAttributeText(
	kind: BenchmarkingKeyFactorAttributeKind,
	label: string | null,
	cardChange: number
): string {
	const [ whileOthersFell, whileOthersRose ] = getOversizedAttributeLines(
		kind,
		label
	);

	return cardChange >= 0 ? whileOthersFell : whileOthersRose;
}

/**
 * Gets the line of a search keyword, whose change in clicks is measured
 * against all of the site's search clicks, never against its card's visits.
 *
 * - A share says that the change is equal to that share of the site's search
 *   clicks, so it doesn't read as the keyword's own share of the clicks.
 * - A share that rounds to `0` is under 0.05% of the site's clicks, which
 *   reads as less than 0.1%.
 * - A keyword that moved against the site's search clicks, or further than
 *   their change, also says that other queries moved the other way, in place
 *   of a share under 0.1%, which would read as a keyword too small to name.
 * - Without the site's search clicks, there is no share to give, and nothing
 *   to say other queries did, so the keyword shows its change alone.
 *
 * @since n.e.x.t
 *
 * @param {Object}  attribute                The search keyword.
 * @param {number}  attribute.sharePct       Its change as a share of the site's search clicks, in percent, or `0`.
 * @param {boolean} attribute.oversized      Whether it moved against the site's search clicks, or further than their change.
 * @param {boolean} attribute.noSearchClicks Whether the site's search clicks are unknown.
 * @param {number}  cardChange               The change in visits of the keyword's card, negative for a drop, which the keyword moved with.
 * @return {string|null} The line, or null when the keyword shows none.
 */
function getSearchKeywordShareText(
	{
		sharePct,
		oversized,
		noSearchClicks,
	}: Pick<
		BenchmarkingKeyFactorAttribute,
		'sharePct' | 'oversized' | 'noSearchClicks'
	>,
	cardChange: number
): string | null {
	if ( noSearchClicks ) {
		return null;
	}

	if ( sharePct > 0 ) {
		const share = formatSharePercent( sharePct );

		if ( ! oversized ) {
			return sprintf(
				/* translators: %s: a search keyword's change in clicks as a share of all of the site's search clicks, such as "3.6%" */
				__(
					'A change equal to %s of the site’s search clicks',
					'google-site-kit'
				),
				share
			);
		}

		// The other queries moved against the keyword, which moved with its
		// card.
		return cardChange >= 0
			? sprintf(
					/* translators: %s: a search keyword's change in clicks as a share of all of the site's search clicks, such as "3.6%" */
					__(
						'A change equal to %s of the site’s search clicks, while other queries fell',
						'google-site-kit'
					),
					share
			  )
			: sprintf(
					/* translators: %s: a search keyword's change in clicks as a share of all of the site's search clicks, such as "3.6%" */
					__(
						'A change equal to %s of the site’s search clicks, while other queries rose',
						'google-site-kit'
					),
					share
			  );
	}

	if ( oversized ) {
		return getOversizedAttributeText( 'SEARCH_KEYWORD', null, cardChange );
	}

	return sprintf(
		/* translators: %s: the smallest share shown, "0.1%" */
		__(
			'A change equal to less than %s of the site’s search clicks',
			'google-site-kit'
		),
		formatSharePercent( 0.1 )
	);
}

/**
 * Gets the line an attribute of a key factor card shows under its change,
 * which says what the change is a share of, as the Site Kit service renders
 * the card's rows (§5.10 *Rendering*).
 *
 * - A search keyword's change in clicks is measured against all of the site's
 *   search clicks, as `getSearchKeywordShareText()` words it.
 * - A channel of the paid group is a share of the paid channels' movement in
 *   both directions, rather than of the group's net change.
 * - An attribute that moved further than its card, the same way, says that
 *   the card's other parts of its kind moved the other way, such as "While
 *   other pages fell". It has no share, and never reads as a share above
 *   100%.
 * - Any other attribute with a share, such as a channel that brought visits to
 *   a page's card, is a share of its card's change, and all of it from 99.5%.
 *
 * An attribute without a share, such as the channel's page under a referring
 * site that took the channel's card, shows its change alone. The two sides of
 * a net show as one row, whose line `formatNetPairOffset()` gives.
 *
 * @since n.e.x.t
 *
 * @param {Object}  card                     The attribute's card.
 * @param {string}  card.kind                The card's kind, such as `CHANNEL_GROUP`.
 * @param {number}  card.change              The card's change in visits, negative for a drop.
 * @param {Object}  attribute                The attribute.
 * @param {string}  attribute.kind           The attribute's kind, such as `SEARCH_KEYWORD`.
 * @param {string}  attribute.label          The attribute's value, such as `new` for a visitor type.
 * @param {number}  attribute.sharePct       The attribute's share, in percent, or `0` without one.
 * @param {boolean} attribute.oversized      Whether the attribute moved further than its card, the same way.
 * @param {boolean} attribute.noSearchClicks Whether the site's search clicks are unknown, for a search keyword.
 * @return {string|null} The line, or null when the attribute shows none.
 */
export function getKeyFactorAttributeShareText(
	{ kind: cardKind, change: cardChange }: KeyFactorAttributeCard,
	attribute: Pick<
		BenchmarkingKeyFactorAttribute,
		'kind' | 'label' | 'sharePct' | 'oversized' | 'noSearchClicks'
	>
): string | null {
	const { kind, label, sharePct, oversized } = attribute;

	if ( kind === 'SEARCH_KEYWORD' ) {
		return getSearchKeywordShareText( attribute, cardChange );
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
		return getOversizedAttributeText( kind, label, cardChange );
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
 * Checks whether two adjacent attributes of a card are the two sides of a net,
 * which show as one row: neither has a share, they moved in opposite
 * directions, and both count the card's visits. A search keyword counts
 * clicks, and a channel's share is of its card's movement, so neither is ever
 * a side of a net.
 *
 * @since n.e.x.t
 *
 * @param {Object} first  The first attribute, with `kind`, `current`, `previous` and `sharePct`.
 * @param {Object} second The attribute after it, with the same fields.
 * @return {boolean} Whether the two attributes are the two sides of a net.
 */
export function isKeyFactorNetPair(
	first: Pick<
		BenchmarkingKeyFactorAttribute,
		'kind' | 'current' | 'previous' | 'sharePct'
	>,
	second: Pick<
		BenchmarkingKeyFactorAttribute,
		'kind' | 'current' | 'previous' | 'sharePct'
	>
): boolean {
	return (
		first.sharePct === 0 &&
		second.sharePct === 0 &&
		( first.current - first.previous ) *
			( second.current - second.previous ) <
			0 &&
		[ first.kind, second.kind ].every(
			( kind ) => kind !== 'SEARCH_KEYWORD' && kind !== 'TRAFFIC_CHANNEL'
		)
	);
}

/**
 * Formats the line of the first side of a net, which names the second side,
 * the part of its card that moved the other way, with that part's change:
 * "Partly offset by -362 visits from mobile". The second side then isn't
 * listed on its own.
 *
 * @since n.e.x.t
 *
 * @param {number} change The second side's change in visits, negative for a drop.
 * @param {string} name   The name the second side shows, such as "mobile" or "Homepage".
 * @return {string} The line.
 */
export function formatNetPairOffset( change: number, name: string ): string {
	return sprintf(
		/* translators: 1: the change in visits of a part of a card that moved against the card, with its sign and unit, such as "-362 visits", 2: the name of that part, such as "mobile" or "Homepage" */
		__( 'Partly offset by %1$s from %2$s', 'google-site-kit' ),
		formatVisitsChange( change ),
		name
	);
}

/**
 * Gets the rows a key factor card lists, one for each attribute, except that
 * the two sides of a net are one row, as the Site Kit service connects them on
 * one line: the first side, whose line names the second side and its change,
 * such as "Partly offset by -362 visits from mobile".
 *
 * @since n.e.x.t
 *
 * @param {Object} card               The card.
 * @param {string} card.kind          The card's kind, such as `CHANNEL`.
 * @param {number} card.change        The card's change in visits, negative for a drop.
 * @param {Array}  attributes         The card's attributes that have a value, in the order to list them.
 * @param {string} [referenceSiteURL] Optional. The site's URL, which a landing page's path is resolved against.
 * @return {Array<Object>} The rows, in the order to list them.
 */
export function getKeyFactorRows(
	card: KeyFactorAttributeCard,
	attributes: NamedKeyFactorAttribute[],
	referenceSiteURL?: string
): KeyFactorRow[] {
	const rows: KeyFactorRow[] = [];

	// A plain loop, since the second side of a net is skipped.
	for ( let index = 0; index < attributes.length; index++ ) {
		const attribute = attributes[ index ];
		const next = attributes[ index + 1 ];
		const name = getKeyFactorAttributeName( attribute, referenceSiteURL );

		if ( next && isKeyFactorNetPair( attribute, next ) ) {
			rows.push( {
				attribute,
				name,
				shareText: formatNetPairOffset(
					next.current - next.previous,
					getKeyFactorAttributeName( next, referenceSiteURL )
				),
			} );

			// The first side's line names the second side, so it isn't
			// listed on its own.
			index++;
		} else {
			rows.push( {
				attribute,
				name,
				shareText: getKeyFactorAttributeShareText( card, attribute ),
			} );
		}
	}

	return rows;
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

/**
 * Gets the key factor cards to show: the given cards, or none when they are a
 * lone card with nothing under its title. That is the only card, with no row
 * that has a name and no line saying that its change was spread across many
 * pages.
 *
 * The Site Kit service's design asks clients to hide the card list then, as a
 * catch-all for a block with nothing to show, such as a lone channel's card
 * without rows. The service keeps a channel's card, with its rows, where a
 * part of the channel would take the only card without any, so the card left
 * out is a channel's own, such as one whose parts all fell below the row
 * floors. The line that the change was spread across many pages is the
 * plugin's own, and it is what the card says in place of rows, so a card with
 * it isn't empty.
 *
 * The dashboard's section and the PDF export show the same cards.
 *
 * @since n.e.x.t
 *
 * @param {Array} keyFactors The cards with a name, in the order to show them, each with `attributes` and an optional `spreadAcrossPages`.
 * @return {Array} The cards to show, in the same order.
 */
export function getShownKeyFactors<
	KeyFactor extends Pick<
		BenchmarkingKeyFactor,
		'attributes' | 'spreadAcrossPages'
	>
>( keyFactors: KeyFactor[] ): KeyFactor[] {
	if ( keyFactors.length !== 1 ) {
		return keyFactors;
	}

	const [ { attributes, spreadAcrossPages } ] = keyFactors;

	// A row without a name shows nothing, as on the card.
	const hasLineUnderTitle =
		spreadAcrossPages ||
		attributes.some( ( attribute ) => !! attribute.label );

	return hasLineUnderTitle ? keyFactors : [];
}
