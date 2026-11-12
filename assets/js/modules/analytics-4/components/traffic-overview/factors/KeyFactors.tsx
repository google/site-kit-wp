/**
 * Key factors section.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InfoTooltip from '@/js/components/InfoTooltip';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import { KEY_FACTORS_MAX_CARDS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { BenchmarkingKeyFactor } from '@/js/modules/analytics-4/utils/benchmarking/types';
import KeyFactorCard from './KeyFactorCard';
import KeyFactorCardPlaceholder from './KeyFactorCardPlaceholder';
import KeyFactorsInsightNotice from './KeyFactorsInsightNotice';

export interface KeyFactorsProps {
	/** The key factor cards, in the order to show them. */
	keyFactors: BenchmarkingKeyFactor[];
	/** The number of days in the selected date range, which the heading names. */
	daysInSelectedRange: number;
	/** Whether the key factors have arrived. */
	loaded?: boolean;
	/** The generated summary of the change, where `**` pairs mark the names it highlights. */
	insight?: string | null;
	/** Whether the generated summary is still on its way, which shows its placeholder. */
	insightLoading?: boolean;
	/** The site's URL, which a landing page's path links to. */
	referenceSiteURL?: string;
}

const KeyFactors: FC< KeyFactorsProps > = ( {
	keyFactors,
	daysInSelectedRange,
	loaded = true,
	insight,
	insightLoading = false,
	referenceSiteURL,
} ) => {
	// `useInstanceId` is typed as `string | number`, so it is read as a string
	// the way `TextField` does.
	const instanceID = useInstanceId(
		KeyFactors,
		'googlesitekit-traffic-overview__key-factors-heading'
	);
	const headingID = `${ instanceID }`;

	// A card without a name has nothing to name, so it is left out.
	const cards = keyFactors.filter(
		(
			keyFactor
		): keyFactor is BenchmarkingKeyFactor & {
			label: string;
		} => !! keyFactor.label
	);

	const hasNoCards = loaded && cards.length === 0;
	// The summary comes apart from the cards, so it can show above their
	// placeholders, and it describes the change on its own where there are no
	// cards. Without a summary, the notice takes the place of the cards.
	const showInsight = insightLoading || !! insight;
	const hasNoChange = hasNoCards && ! showInsight;

	const tooltipContent = createInterpolateElement(
		__(
			'Shows what changed most compared with the previous period. <a>Learn more</a>',
			'google-site-kit'
		),
		{
			// TODO: Point the link at the section's support page.
			a: <Link href="#" external hideExternalIndicator />,
		}
	);

	return (
		<section
			className={ classnames(
				'googlesitekit-traffic-overview__key-factors',
				{
					'googlesitekit-traffic-overview__key-factors--no-change':
						hasNoCards,
				}
			) }
			aria-labelledby={ headingID }
		>
			<div className="googlesitekit-traffic-overview__key-factors-header">
				<Typography
					as="h3"
					type={ TYPE_TITLE }
					size={ SIZE_MEDIUM }
					id={ headingID }
				>
					{ sprintf(
						/* translators: %d: the number of days in the selected date range, such as "28" */
						_n(
							'Biggest channel shifts vs. the previous %d day',
							'Biggest channel shifts vs. the previous %d days',
							daysInSelectedRange,
							'google-site-kit'
						),
						daysInSelectedRange
					) }
				</Typography>
				<InfoTooltip title={ tooltipContent } />
			</div>
			{ hasNoChange && (
				// `INFO_CIRCLE` gives the info icon the design shows. The
				// section's styles give the notice the gray background of
				// an `INFO` notice.
				<Notice
					type={ NOTICE_TYPES.INFO_CIRCLE }
					className="googlesitekit-traffic-overview__key-factors-notice"
					description={ sprintf(
						/* translators: %d: the number of days in the selected date range, such as "28" */
						_n(
							'No channel changed notably compared with the previous %d day',
							'No channel changed notably compared with the previous %d days',
							daysInSelectedRange,
							'google-site-kit'
						),
						daysInSelectedRange
					) }
				/>
			) }
			{ showInsight && (
				<KeyFactorsInsightNotice
					text={ insight }
					loading={ insightLoading }
				/>
			) }
			{ ! loaded && (
				<div className="googlesitekit-traffic-overview__key-factors-cards">
					{ Array.from( { length: KEY_FACTORS_MAX_CARDS } ).map(
						( _, index ) => (
							<KeyFactorCardPlaceholder key={ index } />
						)
					) }
				</div>
			) }
			{ loaded && cards.length > 0 && (
				<div className="googlesitekit-traffic-overview__key-factors-cards">
					{ cards.map(
						( { label, current, previous, attributes }, index ) => (
							<KeyFactorCard
								// Keyed by position: nothing here reorders, and
								// two kinds of driver can share a name.
								key={ index }
								label={ label }
								change={ current - previous }
								attributes={ attributes }
								referenceSiteURL={ referenceSiteURL }
							/>
						)
					) }
				</div>
			) }
		</section>
	);
};

export default KeyFactors;
