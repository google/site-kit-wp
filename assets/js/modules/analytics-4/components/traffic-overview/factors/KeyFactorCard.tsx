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
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	TYPE_LABEL,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import { getPageURL } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPageURL';
import { BenchmarkingKeyFactorAttribute } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { KEY_FACTOR_ATTRIBUTE_TITLES } from './attributeTitles';
import KeyFactorAttribute from './KeyFactorAttribute';
import KeyFactorChangeBadge from './KeyFactorChangeBadge';

export interface KeyFactorCardProps {
	/** The driver's name, such as `Referral`. */
	label: string;
	/** The change in visits, negative for a drop. */
	change: number;
	/** The values inside the driver that carried its change, in the order to show them. */
	attributes: BenchmarkingKeyFactorAttribute[];
	/** The site's URL, which a landing page's path links to. */
	referenceSiteURL?: string;
}

/**
 * Gets the address a landing page's path links to.
 *
 * @since n.e.x.t
 *
 * @param {Object}      attribute          The attribute.
 * @param {string}      attribute.kind     The attribute's kind, such as `LANDING_PAGE`.
 * @param {string|null} attribute.label    The attribute's value, such as a page path.
 * @param {string}      [referenceSiteURL] Optional. The site's URL.
 * @return {(string|undefined)} The page's URL, or `undefined` when the attribute is not a landing page on the site.
 */
function getAttributeHref(
	{ kind, label }: BenchmarkingKeyFactorAttribute,
	referenceSiteURL?: string
): string | undefined {
	if ( kind !== 'LANDING_PAGE' || ! label || ! referenceSiteURL ) {
		return undefined;
	}

	return getPageURL( referenceSiteURL, label );
}

const KeyFactorCard: FC< KeyFactorCardProps > = ( {
	label,
	change,
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
					{ label }
				</Typography>
				<KeyFactorChangeBadge change={ change } />
			</div>
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
							label
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
								label={ attribute.label }
								change={
									attribute.current - attribute.previous
								}
								href={ getAttributeHref(
									attribute,
									referenceSiteURL
								) }
							/>
						) ) }
					</dl>
				</div>
			) }
		</section>
	);
};

export default KeyFactorCard;
