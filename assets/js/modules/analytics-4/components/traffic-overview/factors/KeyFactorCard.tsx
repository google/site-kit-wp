/**
 * Key factor card.
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
 * External dependencies
 */
import classnames from 'classnames';
import { FC, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_LABEL,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { useKeyFactorLinkClick } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useKeyFactorLinkClick';
import {
	KEY_FACTOR_ATTRIBUTE_TITLES,
	NamedKeyFactorAttribute,
	getKeyFactorName,
	getKeyFactorRows,
	getPageURL,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';
import {
	BenchmarkingKeyFactorAttribute,
	BenchmarkingKeyFactorKind,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import KeyFactorAttribute from './KeyFactorAttribute';
import KeyFactorChangeBadge from './KeyFactorChangeBadge';

export interface KeyFactorCardProps {
	/** The driver's kind, such as `CONTENT` for a landing page. */
	kind: BenchmarkingKeyFactorKind;
	/** The driver's name, such as `Referral`. */
	label: string;
	/** The change in visits, negative for a drop. */
	change: number;
	/**
	 * What the card's change is a share of, under its title, as
	 * `getKeyFactorShareText()` gives it: its share of the site's visits when
	 * traffic was steady, since its change explains nothing then, or the
	 * channel whose place it took, with its share of the channel's change or
	 * as more than it. Null when the card shows its change alone.
	 */
	shareText?: string | null;
	/** The values inside the driver that carried its change, in the order to show them. */
	attributes: BenchmarkingKeyFactorAttribute[];
	/**
	 * Whether the change of a card without attributes was spread across many
	 * pages, which the card says in their place, so it doesn't show its title
	 * and its change alone.
	 */
	spreadAcrossPages?: boolean;
	/**
	 * Whether the card is for its channel's pages other than a page that
	 * brought visits from several channels, which took a card of its own.
	 */
	otherPages?: boolean;
	/** The page's path on a `CONTENT` card, which its title links to. */
	url?: string;
	/** The site's URL, which a landing page's path is resolved against to link to the page's entity dashboard. */
	referenceSiteURL?: string;
}

/**
 * Gets the URL of the page that a landing page attribute names.
 *
 * @since n.e.x.t
 *
 * @param {Object}      attribute          The attribute.
 * @param {string}      attribute.kind     The attribute's kind, such as `LANDING_PAGE`.
 * @param {string|null} attribute.label    The attribute's value, such as a page path.
 * @param {string}      [referenceSiteURL] Optional. The site's URL.
 * @return {(string|undefined)} The page's URL, or `undefined` when the attribute is not a landing page on the site.
 */
function getAttributePageURL(
	{ kind, label }: BenchmarkingKeyFactorAttribute,
	referenceSiteURL?: string
): string | undefined {
	if ( kind !== 'LANDING_PAGE' || ! label || ! referenceSiteURL ) {
		return undefined;
	}

	return getPageURL( referenceSiteURL, label );
}

const KeyFactorCard: FC< KeyFactorCardProps > = ( {
	kind,
	label,
	change,
	shareText,
	attributes,
	spreadAcrossPages = false,
	otherPages = false,
	url,
	referenceSiteURL,
} ) => {
	// `useInstanceId` is typed as `string | number`, so it is read as a string
	// the way `TextField` does.
	const instanceID = useInstanceId(
		KeyFactorCard,
		'googlesitekit-traffic-overview__key-factor-title'
	);
	const titleID = `${ instanceID }`;

	// An attribute without a value has nothing to name, so it is left out.
	const namedAttributes = attributes.filter(
		( attribute ): attribute is NamedKeyFactorAttribute =>
			!! attribute.label
	);
	// The two sides of a net are one row, so there can be fewer rows than
	// attributes.
	const rows = getKeyFactorRows(
		{ kind, change },
		namedAttributes,
		referenceSiteURL
	);

	// A landing page links to the page's entity dashboard, the Site Kit
	// dashboard for that one page, by its path, whatever name it shows.
	const attributeHrefs = useSelect(
		( select: Select ) =>
			rows.map( ( { attribute } ) => {
				const pageURL = getAttributePageURL(
					attribute,
					referenceSiteURL
				);

				return pageURL
					? select( CORE_SITE ).getAdminURL(
							'googlesitekit-dashboard',
							{ permaLink: pageURL }
					  )
					: undefined;
			} ),
		[ rows, referenceSiteURL ]
	);

	// A page's title links to the page's entity dashboard, as a landing page
	// row does.
	const titleHref = useSelect(
		( select: Select ) =>
			kind === 'CONTENT' && url && referenceSiteURL
				? select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
						permaLink: getPageURL( referenceSiteURL, url ),
				  } )
				: undefined,
		[ kind, url, referenceSiteURL ]
	);

	const handleLinkClick = useKeyFactorLinkClick( kind );

	const name = getKeyFactorName(
		{ kind, label, otherPages },
		referenceSiteURL
	);

	// A change spread across many pages is a real answer, rather than a gap,
	// so it takes the place of the attributes.
	const showSpread = namedAttributes.length === 0 && spreadAcrossPages;
	const hasDetails = namedAttributes.length > 0 || showSpread;

	return (
		<section
			className={ classnames(
				'googlesitekit-traffic-overview__key-factor',
				{
					// A card with nothing under its title has no connector
					// running down to the attributes.
					'googlesitekit-traffic-overview__key-factor--without-details':
						! hasDetails,
				}
			) }
			aria-labelledby={ titleID }
		>
			<div className="googlesitekit-traffic-overview__key-factor-header">
				<Typography
					as="h4"
					type={ TYPE_TITLE }
					size={ SIZE_LARGE }
					id={ titleID }
					className="googlesitekit-traffic-overview__key-factor-title"
					// A long name, such as a page's title, is cut off with an
					// ellipsis, so the `title` gives it in full on hover.
					title={ name }
				>
					{ titleHref ? (
						// The link leads to another Site Kit dashboard, so it
						// opens in the same tab. `noFlex` keeps the link
						// inline, so the ellipsis cuts off its text.
						<Link
							href={ titleHref }
							onClick={ ( event ) =>
								handleLinkClick( event, titleHref )
							}
							// The browser reports a middle click as an
							// `auxclick`.
							onAuxClick={ (
								event: MouseEvent< HTMLAnchorElement >
							) => handleLinkClick( event, titleHref ) }
							noFlex
						>
							{ name }
						</Link>
					) : (
						name
					) }
				</Typography>
				<KeyFactorChangeBadge change={ change } />
			</div>
			{ shareText && (
				<Typography
					as="p"
					type={ TYPE_BODY }
					size={ SIZE_SMALL }
					className="googlesitekit-traffic-overview__key-factor-share"
				>
					{ shareText }
				</Typography>
			) }
			{ hasDetails && (
				<div className="googlesitekit-traffic-overview__key-factor-attributes">
					{ /* The card's title names the driver, so the heading doesn't repeat it. */ }
					<Typography
						as="p"
						type={ TYPE_LABEL }
						size={ SIZE_MEDIUM }
						className="googlesitekit-traffic-overview__key-factor-attributes-heading"
					>
						{ __( 'Top changes', 'google-site-kit' ) }
					</Typography>
					{ showSpread ? (
						<Typography
							as="p"
							type={ TYPE_BODY }
							size={ SIZE_SMALL }
							className="googlesitekit-traffic-overview__key-factor-spread"
						>
							{ __(
								'Spread across many pages, with none standing out',
								'google-site-kit'
							) }
						</Typography>
					) : (
						<dl className="googlesitekit-traffic-overview__key-factor-attribute-list">
							{ rows.map( ( row, index ) => (
								<KeyFactorAttribute
									// Keyed by position: nothing here reorders,
									// and two kinds can share a value.
									key={ index }
									title={
										KEY_FACTOR_ATTRIBUTE_TITLES[
											row.attribute.kind
										]
									}
									label={ row.name }
									change={
										row.attribute.current -
										row.attribute.previous
									}
									// A search keyword's change counts its clicks
									// in Search Console, which are not visits.
									unit={
										row.attribute.kind === 'SEARCH_KEYWORD'
											? 'clicks'
											: 'visits'
									}
									shareText={ row.shareText }
									href={ attributeHrefs[ index ] }
									onLinkClick={ handleLinkClick }
								/>
							) ) }
						</dl>
					) }
				</div>
			) }
		</section>
	);
};

export default KeyFactorCard;
