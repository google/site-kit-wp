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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
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
import { formatVisitsShare } from '@/js/modules/analytics-4/components/traffic-overview/utils/formatVisitsShare';
import { getPageURL } from '@/js/modules/analytics-4/components/traffic-overview/utils/getPageURL';
import {
	BenchmarkingKeyFactorAttribute,
	BenchmarkingKeyFactorKind,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { KEY_FACTOR_ATTRIBUTE_TITLES } from './attributeTitles';
import { getKeyFactorName } from './getKeyFactorName';
import { getLandingPageLabel } from './getLandingPageLabel';
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
	 * The driver's share of the site's visits, in percent, which a card shows
	 * when traffic was steady, since its change explains nothing then.
	 */
	visitsSharePct?: number;
	/** The values inside the driver that carried its change, in the order to show them. */
	attributes: BenchmarkingKeyFactorAttribute[];
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

/**
 * Gets the name an attribute shows for its value.
 *
 * @since n.e.x.t
 *
 * @param {Object} attribute          The attribute.
 * @param {string} attribute.kind     The attribute's kind, such as `LANDING_PAGE`.
 * @param {string} attribute.label    The attribute's value, such as a page path.
 * @param {string} [referenceSiteURL] Optional. The site's URL.
 * @return {string} "Homepage" when the attribute is the site's homepage, or its value otherwise.
 */
function getAttributeLabel(
	{ kind, label }: BenchmarkingKeyFactorAttribute & { label: string },
	referenceSiteURL?: string
): string {
	return kind === 'LANDING_PAGE'
		? getLandingPageLabel( label, referenceSiteURL )
		: label;
}

const KeyFactorCard: FC< KeyFactorCardProps > = ( {
	kind,
	label,
	change,
	visitsSharePct,
	attributes,
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
		(
			attribute
		): attribute is BenchmarkingKeyFactorAttribute & {
			label: string;
		} => !! attribute.label
	);

	// A landing page links to the page's entity dashboard, the Site Kit
	// dashboard for that one page.
	const attributeHrefs = useSelect(
		( select: Select ) =>
			namedAttributes.map( ( attribute ) => {
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
		[ namedAttributes, referenceSiteURL ]
	);

	const name = getKeyFactorName( kind, label, referenceSiteURL );

	return (
		<section
			className="googlesitekit-traffic-overview__key-factor"
			aria-labelledby={ titleID }
		>
			<div className="googlesitekit-traffic-overview__key-factor-header">
				<Typography
					as="h4"
					type={ TYPE_TITLE }
					size={ SIZE_LARGE }
					id={ titleID }
					className="googlesitekit-traffic-overview__key-factor-title"
				>
					{ name }
				</Typography>
				<KeyFactorChangeBadge change={ change } />
			</div>
			{ visitsSharePct !== undefined && (
				<Typography
					as="p"
					type={ TYPE_BODY }
					size={ SIZE_SMALL }
					className="googlesitekit-traffic-overview__key-factor-visits-share"
				>
					{ formatVisitsShare( visitsSharePct ) }
				</Typography>
			) }
			{ namedAttributes.length > 0 && (
				<div className="googlesitekit-traffic-overview__key-factor-attributes">
					<Typography
						as="p"
						type={ TYPE_LABEL }
						size={ SIZE_MEDIUM }
						className="googlesitekit-traffic-overview__key-factor-attributes-heading"
					>
						{ sprintf(
							/* translators: %s: the name of the driver behind the change, such as "Referral" */
							__( 'Top changes within %s', 'google-site-kit' ),
							name
						) }
					</Typography>
					<dl className="googlesitekit-traffic-overview__key-factor-attribute-list">
						{ namedAttributes.map( ( attribute, index ) => (
							<KeyFactorAttribute
								// Keyed by position: nothing here reorders,
								// and two kinds can share a value.
								key={ index }
								title={
									KEY_FACTOR_ATTRIBUTE_TITLES[
										attribute.kind
									]
								}
								label={ getAttributeLabel(
									attribute,
									referenceSiteURL
								) }
								change={
									attribute.current - attribute.previous
								}
								// A search keyword's change counts its clicks
								// in Search Console, which are not visits.
								unit={
									attribute.kind === 'SEARCH_KEYWORD'
										? 'clicks'
										: 'visits'
								}
								href={ attributeHrefs[ index ] }
							/>
						) ) }
					</dl>
				</div>
			) }
		</section>
	);
};

export default KeyFactorCard;
