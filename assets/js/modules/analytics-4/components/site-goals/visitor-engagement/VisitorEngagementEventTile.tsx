/**
 * Site Goals Visitor Engagement Event tile.
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
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect, Select } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { Tile } from '@/js/modules/analytics-4/components/site-goals/components/Tile';
import { NUMBER_FORMAT } from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import {
	getVisitorEngagementEventTileLabel,
	VisitorEngagementEventID,
} from '@/js/modules/analytics-4/components/site-goals/visitor-engagement/registry';

interface VisitorEngagementEventTileProps {
	dates: {
		startDate: string;
		endDate: string;
		compareStartDate?: string;
		compareEndDate?: string;
	};
	eventName: VisitorEngagementEventID;
}

const VisitorEngagementEventTile: FC< VisitorEngagementEventTileProps > = ( {
	dates,
	eventName,
} ) => {
	const reportOptions: ReportOptions = useMemo(
		() => ( {
			compareEndDate: dates.compareEndDate,
			compareStartDate: dates.compareStartDate,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName,
			},
			endDate: dates.endDate,
			reportID: `analytics-4_site-goals_visitor-engagement_${ eventName }`,
			startDate: dates.startDate,
		} ),
		[
			dates.compareEndDate,
			dates.compareStartDate,
			dates.endDate,
			dates.startDate,
			eventName,
		]
	);

	const report =
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

	const { currentPrimaryCount, previousPrimaryCount } = processReports(
		report,
		{}
	);

	return (
		<Tile
			title={ getVisitorEngagementEventTileLabel( eventName ) }
			subtitle={ sprintf(
				/* translators: %s: GA4 event name */
				__( '“%s” events', 'google-site-kit' ),
				eventName
			) }
			currentValue={ currentPrimaryCount }
			previousValue={ previousPrimaryCount }
			loading={ loading }
			error={ error }
			format={ NUMBER_FORMAT }
		/>
	);
};

export default VisitorEngagementEventTile;
