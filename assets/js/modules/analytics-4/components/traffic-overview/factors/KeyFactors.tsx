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
import DocumentationLink from '@/js/components/DocumentationLink';
import InfoTooltip from '@/js/components/InfoTooltip';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import { KEY_FACTORS_MAX_CARDS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	getKeyFactorShareText,
	getKeyFactorsNoticeText,
	getShownKeyFactors,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { BenchmarkingKeyFactor } from '@/js/modules/analytics-4/utils/benchmarking/types';
import KeyFactorCard from './KeyFactorCard';
import KeyFactorCardPlaceholder from './KeyFactorCardPlaceholder';
import KeyFactorsInsightNotice from './KeyFactorsInsightNotice';

export interface KeyFactorsProps {
	/** The key factor cards, in the order to show them. None until they arrive. */
	keyFactors?: BenchmarkingKeyFactor[];
	/**
	 * Whether traffic was steady: no channel changed notably compared with the
	 * previous period. The cards are then the channels with the most visits,
	 * each with its share of the site's visits.
	 */
	steady?: boolean;
	/** The number of days in the selected date range, which the heading names. */
	daysInSelectedRange: number;
	/** Whether the key factors have arrived. */
	loaded?: boolean;
	/** The generated summary of the change, where `**` pairs mark the names it highlights. */
	insight?: string | null;
	/** Whether the generated summary is still on its way, which shows its placeholder. */
	insightLoading?: boolean;
	/** The site's URL, which a landing page's path is resolved against to link to the page's entity dashboard. */
	referenceSiteURL?: string;
}

const KeyFactors: FC< KeyFactorsProps > = ( {
	keyFactors = [],
	steady = false,
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

	// A lone card with nothing under its title is left out too, as the Site
	// Kit service's design asks. The notice below still counts it, so hiding
	// the card never makes the notice say that no channel changed notably.
	const shownCards = getShownKeyFactors( cards );
	const hasNoCards = loaded && shownCards.length === 0;
	// The response tells whether traffic was steady, by the rule the Site Kit
	// service writes the summary by, so the notice, the cards and the summary
	// describe the same period.
	const isSteady = loaded && steady;
	const showCards = loaded && shownCards.length > 0;
	// The summary comes apart from the cards, so it can show above their
	// placeholders, and it describes the change on its own where there are no
	// cards.
	const showInsight = insightLoading || !! insight;
	// The notice waits for the key factors, like the cards.
	const noticeText = loaded
		? getKeyFactorsNoticeText( {
				noChange: steady || ( cards.length === 0 && ! showInsight ),
				daysInSelectedRange,
		  } )
		: null;

	// Without a card, a notice or a summary, the section would be a heading
	// with nothing under it. A section without cards has the notice unless it
	// has the summary, so this happens only when a lone card was left out.
	if ( hasNoCards && ! noticeText && ! showInsight ) {
		return null;
	}

	const tooltipContent = createInterpolateElement(
		__(
			'Shows what changed most compared with the previous period. <a>Learn more</a>',
			'google-site-kit'
		),
		{
			// The slug names the section by its heading, "Biggest traffic
			// shifts".
			a: <DocumentationLink slug="typical-traffic-shifts" />,
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
					{ /* A card can name a page, keyword, referring site or campaign as well as a channel, so the heading names traffic. */ }
					{ sprintf(
						/* translators: %d: the number of days in the selected date range, such as "28" */
						_n(
							'Biggest traffic shifts vs. the previous %d day',
							'Biggest traffic shifts vs. the previous %d days',
							daysInSelectedRange,
							'google-site-kit'
						),
						daysInSelectedRange
					) }
				</Typography>
				<InfoTooltip title={ tooltipContent } />
			</div>
			{ noticeText && (
				// `INFO_CIRCLE` gives the info icon the design shows. The
				// section's styles give the notice the gray background of
				// an `INFO` notice.
				<Notice
					type={ NOTICE_TYPES.INFO_CIRCLE }
					className="googlesitekit-traffic-overview__key-factors-notice"
					description={ noticeText }
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
			{ showCards && (
				<div className="googlesitekit-traffic-overview__key-factors-cards">
					{ shownCards.map( ( keyFactor, index ) => (
						<KeyFactorCard
							// Keyed by position: nothing here reorders, and
							// two kinds of driver can share a name.
							key={ index }
							kind={ keyFactor.kind }
							label={ keyFactor.label }
							change={ keyFactor.current - keyFactor.previous }
							shareText={ getKeyFactorShareText( keyFactor, {
								steady: isSteady,
							} ) }
							attributes={ keyFactor.attributes }
							spreadAcrossPages={ keyFactor.spreadAcrossPages }
							otherPages={ keyFactor.otherPages }
							url={ keyFactor.url }
							referenceSiteURL={ referenceSiteURL }
						/>
					) ) }
				</div>
			) }
		</section>
	);
};

export default KeyFactors;
