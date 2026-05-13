/**
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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect, Select } from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { numFmt } from '@/js/util';
import type { WidgetComponentProps } from '@/js/googlesitekit/widgets/util/get-widget-component-props';
import WidgetHeaderTitle from '@/js/googlesitekit/widgets/components/WidgetHeaderTitle';
import PreviewBlock from '@/js/components/PreviewBlock';
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import { Tile } from '@/js/modules/analytics-4/components/site-goals/components/Tile';
import ChangeGoalDriversLink from '@/js/modules/analytics-4/components/site-goals/ChangeGoalDriversLink';
import {
	GOAL_DRIVER_CATALOG,
	GOAL_TYPES,
	GoalDriverTiles,
	resolveGoalDriverIDs,
	resolveGoalDriverSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import {
	SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
	SITE_GOALS_EFFECTIVE_DRIVERS,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	NUMBER_FORMAT,
	PERCENT_FORMAT,
} from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';

const LeadGenerationPerformanceWidget: FC< WidgetComponentProps > = ( {
	Widget,
	WidgetNull,
	WidgetReportError,
} ) => {
	const detectedLeadEvents = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
		[]
	);
	const effectiveSelectedDrivers = useSelect(
		( select: Select ) =>
			select( CORE_FORMS ).getValue(
				SITE_GOALS_SELECTION_FORM,
				SITE_GOALS_EFFECTIVE_DRIVERS
			),
		[]
	) as { [ key: string ]: string[] } | undefined;
	const resolvedSelections = resolveGoalDriverSelectionState(
		effectiveSelectedDrivers || SITE_GOALS_DEFAULT_SELECTED_DRIVERS
	);

	const hasLeadEvents = !! detectedLeadEvents?.length;
	const drivers = useMemo(
		() =>
			resolveGoalDriverIDs(
				resolvedSelections[ GOAL_TYPES.LEAD ],
				GOAL_TYPES.LEAD
			).map( ( driverID ) => ( {
				...GOAL_DRIVER_CATALOG[ driverID ],
			} ) ),
		[ resolvedSelections ]
	);

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
		[]
	);

	const reportOptions: ReportOptions[] = [];

	if ( hasLeadEvents ) {
		reportOptions.push( {
			...dates,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: detectedLeadEvents || [],
				},
			},
			reportID:
				'analytics-4_lead-generation-performance-widget_widget_leadEventsReportOptions',
		} );

		reportOptions.push( {
			...dates,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			reportID: 'analytics-4_site-goals_engagementReportOptions',
		} );
	}

	// Ensure we have a consistent number of entries in the report options
	// array, so that the useSelect dependencies are consistent.
	//
	// If `reportOptions` is used directly as a dependency for the useSelect
	// calls below, it will cause a console error while loading.
	const reportOptionArgsForSelect = reportOptions?.length
		? reportOptions
		: [ undefined, undefined ];

	const [ leadEventsReport, engagementReport ] =
		useInViewSelect(
			( select: Select ) =>
				reportOptions.map( ( options ) =>
					select( MODULES_ANALYTICS_4 ).getReport( options )
				),
			reportOptionArgsForSelect
		) || [];

	const [ loading, error ] = useSelect(
		( select: Select ) => [
			select( MODULES_ANALYTICS_4 ).areReportsLoading( ...reportOptions ),
			select( MODULES_ANALYTICS_4 ).getFirstReportError(
				...reportOptions
			),
		],
		reportOptionArgsForSelect
	);

	if ( ! hasLeadEvents ) {
		return <WidgetNull />;
	}

	if ( error ) {
		return (
			<Widget>
				<WidgetReportError moduleSlug="analytics-4" error={ error } />
			</Widget>
		);
	}

	const {
		currentPrimaryCount,
		previousPrimaryCount,
		currentSessions,
		currentRate,
		previousRate,
	} = processReports( leadEventsReport, engagementReport, {
		aggregate: true,
	} );

	return (
		<Widget
			Header={ WidgetHeaderTitle }
			headerContents={ __(
				'Lead generation performance',
				'google-site-kit'
			) }
			collapsible
		>
			{ loading && <PreviewBlock width="100%" height="130px" /> }

			{ ! loading && (
				<TilesGroup
					className="googlesitekit-site-goals-primary-action"
					title={ __( 'Key action', 'google-site-kit' ) }
				>
					<Tile
						title={ __(
							'Form completion rate',
							'google-site-kit'
						) }
						subtitle={ sprintf(
							/* translators: %s: formatted number of total sessions */
							__( '%s total sessions', 'google-site-kit' ),
							numFmt( currentSessions, NUMBER_FORMAT )
						) }
						currentValue={ currentRate }
						previousValue={ previousRate }
						format={ PERCENT_FORMAT }
						primary
					/>

					<Tile
						title={ __(
							'Total form completions',
							'google-site-kit'
						) }
						subtitle={
							detectedLeadEvents.length === 1
								? sprintf(
										/* translators: %s: GA4 event name */
										__( '"%s" events', 'google-site-kit' ),
										detectedLeadEvents[ 0 ]
								  )
								: sprintf(
										/* translators: %d: number of detected event types */
										_n(
											'%d event type',
											'%d event types',
											detectedLeadEvents.length,
											'google-site-kit'
										),
										detectedLeadEvents.length
								  )
						}
						currentValue={ currentPrimaryCount }
						previousValue={ previousPrimaryCount }
						format={ NUMBER_FORMAT }
					/>
				</TilesGroup>
			) }

			<TilesGroup
				className="googlesitekit-site-goals-goal-drivers-group"
				title={ __(
					'What’s helping you reach your goals?',
					'google-site-kit'
				) }
				headerCTA={ <ChangeGoalDriversLink /> }
			>
				<GoalDriverTiles
					drivers={ drivers }
					primaryEvent={ detectedLeadEvents }
					goalType={ GOAL_TYPES.LEAD }
				/>
			</TilesGroup>
		</Widget>
	);
};

export default LeadGenerationPerformanceWidget;
