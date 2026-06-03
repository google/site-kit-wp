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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import PreviewBlock from '@/js/components/PreviewBlock';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import WidgetHeaderTitle from '@/js/googlesitekit/widgets/components/WidgetHeaderTitle';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import ChangeGoalDriversLink from '@/js/modules/analytics-4/components/site-goals/ChangeGoalDriversLink';
import { Tile } from '@/js/modules/analytics-4/components/site-goals/components/Tile';
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import { SITE_GOALS_DEFAULT_SELECTED_DRIVERS } from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_DRIVER_CATALOG,
	GOAL_TYPES,
	GoalDriverSelectionState,
	GoalDriverTiles,
	getGoalDriverTitle,
	resolveGoalDriverIDs,
	resolveGoalDriverSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import { GoalDriverID } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	NUMBER_FORMAT,
	PERCENT_FORMAT,
} from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import { VisitorEngagementTiles } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface LeadGenerationPerformanceWidgetProps extends WidgetComponentProps {
	selectedGoalDriverIDs?: GoalDriverID[];
}

const LeadGenerationPerformanceWidget: FC<
	LeadGenerationPerformanceWidgetProps
> = ( { Widget, WidgetNull, WidgetReportError, selectedGoalDriverIDs } ) => {
	const WidgetComponent = Widget as FC< {
		Header?: unknown;
		headerContents?: ReactNode;
		collapsible?: boolean;
		children?: ReactNode;
	} >;
	const WidgetNullComponent = WidgetNull as FC;
	const WidgetReportErrorComponent = WidgetReportError as FC< {
		moduleSlug: string;
		error: unknown;
	} >;

	// TODO: Update the link to the relevant support URL once it's created.
	// See: https://github.com/google/site-kit-wp/issues/12727
	const keyActionSupportURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getGoogleSupportURL( {
				path: '/TODO-SUPPORT-PATH',
			} ),
		[]
	);

	const detectedLeadEvents = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
		[]
	);
	const effectiveSelectedDrivers = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getSiteGoalsGoalDrivers(),
		[]
	) as GoalDriverSelectionState | undefined;
	const resolvedSelections = resolveGoalDriverSelectionState(
		effectiveSelectedDrivers || SITE_GOALS_DEFAULT_SELECTED_DRIVERS
	);

	const hasLeadEvents = !! detectedLeadEvents?.length;
	const drivers = resolveGoalDriverIDs(
		selectedGoalDriverIDs || resolvedSelections[ GOAL_TYPES.LEAD ],
		GOAL_TYPES.LEAD
	).map( ( driverID ) => ( {
		...GOAL_DRIVER_CATALOG[ driverID ],
		title: getGoalDriverTitle( GOAL_TYPES.LEAD, driverID ),
	} ) );

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
		[]
	);

	let leadEventsReportOptions: ReportOptions | null = null;
	let engagementReportOptions: ReportOptions | null = null;

	if ( hasLeadEvents ) {
		leadEventsReportOptions = {
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
		};

		engagementReportOptions = {
			...dates,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			reportID: 'analytics-4_site-goals_engagementReportOptions',
		};
	}

	const leadEventsReport =
		useInViewSelect(
			( select: Select ) =>
				leadEventsReportOptions
					? select( MODULES_ANALYTICS_4 ).getReport(
							leadEventsReportOptions
					  )
					: null,
			[ leadEventsReportOptions ]
		) || [];

	const engagementReport =
		useInViewSelect(
			( select: Select ) =>
				engagementReportOptions
					? select( MODULES_ANALYTICS_4 ).getReport(
							engagementReportOptions
					  )
					: null,
			[ engagementReportOptions ]
		) || [];

	const [ loading, error ] = useSelect(
		( select: Select ) => {
			const reportsToCheck: ReportOptions[] = [];
			if ( leadEventsReportOptions ) {
				reportsToCheck.push( leadEventsReportOptions );
			}
			if ( engagementReportOptions ) {
				reportsToCheck.push( engagementReportOptions );
			}

			return [
				select( MODULES_ANALYTICS_4 ).areReportsLoading(
					...reportsToCheck
				),
				select( MODULES_ANALYTICS_4 ).getFirstReportError(
					...reportsToCheck
				),
			];
		},
		[ leadEventsReportOptions, engagementReportOptions ]
	);

	if ( ! hasLeadEvents ) {
		return <WidgetNullComponent />;
	}

	if ( error ) {
		return (
			<WidgetComponent>
				<WidgetReportErrorComponent
					moduleSlug="analytics-4"
					error={ error }
				/>
			</WidgetComponent>
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
		<WidgetComponent
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
							__( 'of %s total sessions', 'google-site-kit' ),
							numFmt( currentSessions, NUMBER_FORMAT )
						) }
						infoTooltip={ createInterpolateElement(
							__(
								'The percentage of total visitors who successfully completed a key action (like making a purchase or filling out a form). <a>Learn more</a>',
								'google-site-kit'
							),
							{
								a: (
									// Content is added via
									// createInterpolateElement, so this
									// can be safely ignored.
									//
									// eslint-disable-next-line jsx-a11y/anchor-has-content
									<a
										href={ keyActionSupportURL }
										target="_blank"
										rel="noreferrer noopener"
									/>
								),
							}
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
										__( '“%s” events', 'google-site-kit' ),
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
				className="googlesitekit-site-goals-visitor-engagement"
				title={ __(
					'How are your visitors engaging?',
					'google-site-kit'
				) }
			>
				<VisitorEngagementTiles dates={ dates } />
			</TilesGroup>

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
		</WidgetComponent>
	);
};

export default LeadGenerationPerformanceWidget;
