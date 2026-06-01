/**
 * Site Goals Visitor Engagement Rate tile.
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
import { createInterpolateElement, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { Tile } from '@/js/modules/analytics-4/components/site-goals/components/Tile';
import {
	NUMBER_FORMAT,
	PERCENT_FORMAT,
} from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';

interface DateRange {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
}

export interface EngagementRateTileProps {
	dates: DateRange;
}

const EngagementRateTile: FC< EngagementRateTileProps > = ( { dates } ) => {
	// TODO: Update the link to the relevant support URL once it's created.
	// See: https://github.com/google/site-kit-wp/issues/12727
	const engagementSupportURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getGoogleSupportURL( {
				path: '/TODO-SUPPORT-PATH',
			} ),
		[]
	);

	const reportOptions: ReportOptions = useMemo(
		() => ( {
			compareEndDate: dates.compareEndDate,
			compareStartDate: dates.compareStartDate,
			endDate: dates.endDate,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			reportID: 'analytics-4_site-goals_engagementReportOptions',
			startDate: dates.startDate,
		} ),
		[
			dates.compareEndDate,
			dates.compareStartDate,
			dates.endDate,
			dates.startDate,
		]
	);

	const engagementReport =
		useInViewSelect(
			( select: Select ) =>
				select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
			[ reportOptions ]
		) || [];

	const [ loading, error ] = useSelect(
		( select: Select ) => {
			const isFetching = ! select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getReport', [ reportOptions ] );

			return [
				isFetching,
				select( MODULES_ANALYTICS_4 ).getErrorForSelector(
					'getReport',
					[ reportOptions ]
				),
			];
		},
		[ reportOptions ]
	);

	const { currentSessions, currentEngagementRate, previousEngagementRate } =
		processReports( {}, engagementReport );

	return (
		<Tile
			title={ __( 'Engagement rate', 'google-site-kit' ) }
			subtitle={ sprintf(
				/* translators: %s: formatted number of total sessions */
				__( 'of %s total sessions', 'google-site-kit' ),
				numFmt( currentSessions, NUMBER_FORMAT )
			) }
			infoTooltip={ createInterpolateElement(
				__(
					'The percentage of visitors who engaged with your content by staying on a page for a period of time, viewing multiple pages, or completing a key action. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						// Content is added via createInterpolateElement, so this
						// can be safely ignored.
						//
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						<a
							href={ engagementSupportURL }
							target="_blank"
							rel="noreferrer noopener"
						/>
					),
				}
			) }
			currentValue={ currentEngagementRate }
			previousValue={ previousEngagementRate }
			loading={ loading }
			error={ error }
			format={ PERCENT_FORMAT }
		/>
	);
};

export default EngagementRateTile;
