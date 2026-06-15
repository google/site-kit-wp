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
import { Fragment, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

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
import BreakdownTabs from '@/js/modules/analytics-4/components/site-goals/components/BreakdownTabs';
import GatheringBreakdownDataBadge from '@/js/modules/analytics-4/components/site-goals/components/GatheringBreakdownDataBadge';
import KeyActionTiles from '@/js/modules/analytics-4/components/site-goals/components/KeyActionTiles';
import OtherSourcesNotice from '@/js/modules/analytics-4/components/site-goals/components/OtherSourcesNotice';
import PartialDataBadge from '@/js/modules/analytics-4/components/site-goals/components/PartialDataBadge';
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import {
	BREAKDOWN_ORIGIN_WIDGET,
	SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDERS,
	SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS,
	SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
	SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_VOTE_ID_WIDGET_ONLINE_STORE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
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
import { useSiteGoalsBreakdown } from '@/js/modules/analytics-4/components/site-goals/hooks/useSiteGoalsBreakdown';
import BreakdownNoticeArea from '@/js/modules/analytics-4/components/site-goals/notifications/BreakdownNoticeArea';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import {
	VisitorEngagementTiles,
	resolveVisitorEngagementSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';
import {
	CONVERSION_REPORTING_ECOMMERCE_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import WidgetFeedbackPrompt from './WidgetFeedbackPrompt';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface OnlineStorePerformanceWidgetProps extends WidgetComponentProps {
	selectedGoalDriverIDs?: GoalDriverID[];
}

interface DateRange {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
}

const EVENT_RATE_LABELS = {
	purchase: __( 'Sales Rate', 'google-site-kit' ),
	add_to_cart: __( 'Add to Cart Rate', 'google-site-kit' ),
};

const EVENT_TOTAL_LABELS = {
	purchase: __( 'Total Sales', 'google-site-kit' ),
	add_to_cart: __( 'Products added to cart', 'google-site-kit' ),
};

function getWidgetReportOptions(
	dates: DateRange,
	primaryEvent: keyof typeof EVENT_TOTAL_LABELS | undefined,
	breakdownFilter?: Record< string, unknown >
) {
	const primaryEventReportOptions: ReportOptions | null = primaryEvent
		? {
				...dates,
				metrics: [ { name: 'eventCount' } ],
				dimensions: [ { name: 'eventName' } ],
				dimensionFilters: {
					eventName: primaryEvent,
					// Scopes the Key action to the selected breakdown tab.
					...breakdownFilter,
				} as ReportOptions[ 'dimensionFilters' ],
				reportID:
					'analytics-4_online-store-performance-widget_primaryEventReportOptions',
		  }
		: null;

	const engagementReportOptions: ReportOptions | null = primaryEvent
		? {
				...dates,
				metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
				...( breakdownFilter
					? {
							dimensionFilters:
								breakdownFilter as ReportOptions[ 'dimensionFilters' ],
					  }
					: {} ),
				reportID: 'analytics-4_site-goals_engagementReportOptions',
		  }
		: null;

	return {
		primaryEventReportOptions,
		engagementReportOptions,
	};
}

function getReportsToCheck(
	primaryEventReportOptions: ReportOptions | null,
	engagementReportOptions: ReportOptions | null
): ReportOptions[] {
	return [ primaryEventReportOptions, engagementReportOptions ].filter(
		( reportOptions ): reportOptions is ReportOptions =>
			Boolean( reportOptions )
	);
}

const OnlineStorePerformanceWidget: FC<
	OnlineStorePerformanceWidgetProps
> = ( { Widget, WidgetNull, WidgetReportError, selectedGoalDriverIDs } ) => {
	const WidgetComponent = Widget as FC< {
		Header?: unknown;
		headerContents?: ReactNode;
		collapsible?: boolean;
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

	const primaryEvent: keyof typeof EVENT_TOTAL_LABELS | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryEcommerceEvent(),
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

	const effectiveVisitorEngagement = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getSiteGoalsVisitorEngagement(),
		[]
	);
	const resolvedVisitorEngagement = resolveVisitorEngagementSelectionState(
		effectiveVisitorEngagement ||
			SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT
	);
	const selectedVisitorEngagementEvents =
		resolvedVisitorEngagement[ GOAL_TYPES.ECOMMERCE ];

	const secondaryEcommerceEvents: ( keyof typeof EVENT_TOTAL_LABELS )[] =
		useSelect(
			( select: Select ) =>
				primaryEvent
					? select( MODULES_ANALYTICS_4 ).getSecondaryEcommerceEvents(
							primaryEvent
					  )
					: [],
			[ primaryEvent ]
		);
	const enabledSecondaryEvents = selectedVisitorEngagementEvents.filter(
		( eventName ) =>
			secondaryEcommerceEvents.includes(
				eventName as keyof typeof EVENT_TOTAL_LABELS
			)
	);

	const drivers = resolveGoalDriverIDs(
		selectedGoalDriverIDs || resolvedSelections[ GOAL_TYPES.ECOMMERCE ],
		GOAL_TYPES.ECOMMERCE
	).map( ( driverID ) => ( {
		...GOAL_DRIVER_CATALOG[ driverID ],
		title: getGoalDriverTitle( GOAL_TYPES.ECOMMERCE, driverID ),
	} ) );

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				compare: true,
			} ),
		[]
	) as DateRange;

	// The "Other sources" metric mirrors the Key action's primary event, so detect
	// unattributed events for that event only.
	const detectionEventNames = useMemo(
		() => ( primaryEvent ? [ primaryEvent ] : [] ),
		[ primaryEvent ]
	);

	const {
		breakdownDimension,
		breakdownValues,
		hasBreakdownTabs,
		activeTabID,
		setSelectedTab,
		isOtherSourcesTab,
		hasOtherSources,
		otherSourcesCount,
		otherSourcesPreviousCount,
		breakdownFilter,
	} = useSiteGoalsBreakdown( GOAL_TYPES.ECOMMERCE, {
		// Discovery is scoped to the known ecommerce events; the tabs are then
		// restricted to supported ecommerce plugins via the allowlist.
		eventNames: CONVERSION_REPORTING_ECOMMERCE_EVENTS,
		detectionEventNames,
		supportedValues: SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDERS,
	} );

	// Only the tabbed breakdown shows the partial-data badge; the badge itself
	// renders nothing unless the dimension is in partial-data state.
	const partialDataBadge = hasBreakdownTabs ? (
		<PartialDataBadge customDimensionSlug={ breakdownDimension } />
	) : undefined;

	const { primaryEventReportOptions, engagementReportOptions } =
		getWidgetReportOptions( dates, primaryEvent, breakdownFilter );

	const primaryEventReport =
		useInViewSelect(
			( select: Select ) =>
				primaryEventReportOptions
					? select( MODULES_ANALYTICS_4 ).getReport(
							primaryEventReportOptions
					  )
					: null,
			[ primaryEventReportOptions ]
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
			const reportsToCheck = getReportsToCheck(
				primaryEventReportOptions,
				engagementReportOptions
			);

			return [
				select( MODULES_ANALYTICS_4 ).areReportsLoading(
					...reportsToCheck
				),
				select( MODULES_ANALYTICS_4 ).getFirstReportError(
					...reportsToCheck
				),
			];
		},
		[ primaryEventReportOptions, engagementReportOptions ]
	);

	if ( ! primaryEvent ) {
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
	} = processReports( primaryEventReport, engagementReport );

	return (
		<WidgetComponent
			Header={ WidgetHeaderTitle }
			headerContents={
				<Fragment>
					<span>
						{ __( 'Online Store Performance', 'google-site-kit' ) }
					</span>
					<GatheringBreakdownDataBadge
						goalType={ GOAL_TYPES.ECOMMERCE }
						variant="widget"
					/>
				</Fragment>
			}
			collapsible
		>
			{ hasBreakdownTabs && (
				<BreakdownTabs
					tabs={ ( breakdownValues ?? [] ).map( ( value ) => ( {
						id: value,
						label:
							SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS[
								value
							] ?? value,
					} ) ) }
					activeTabID={ activeTabID }
					onTabChange={ setSelectedTab }
					showOtherSources={ hasOtherSources }
					otherSourcesLabel={ __(
						'Other sources',
						'google-site-kit'
					) }
				/>
			) }

			{ isOtherSourcesTab && (
				<OtherSourcesNotice learnMoreURL={ keyActionSupportURL } />
			) }

			{ loading ? (
				<PreviewBlock
					className="googlesitekit-site-goals-tiles-group"
					width="100%"
					height="130px"
				/>
			) : (
				<TilesGroup
					className="googlesitekit-site-goals-primary-action"
					title={ __( 'Key action', 'google-site-kit' ) }
					badge={ partialDataBadge }
				>
					<KeyActionTiles
						isOtherSourcesTab={ isOtherSourcesTab }
						supportURL={ keyActionSupportURL }
						rateTitle={ EVENT_RATE_LABELS[ primaryEvent ] }
						totalTitle={ EVENT_TOTAL_LABELS[ primaryEvent ] }
						totalSubtitle={ sprintf(
							/* translators: %s: GA4 event name */
							__( '“%s” events', 'google-site-kit' ),
							primaryEvent
						) }
						currentRate={ currentRate }
						previousRate={ previousRate }
						currentSessions={ currentSessions }
						currentCount={ currentPrimaryCount }
						previousCount={ previousPrimaryCount }
						otherSourcesCount={ otherSourcesCount }
						otherSourcesPreviousCount={ otherSourcesPreviousCount }
					/>
				</TilesGroup>
			) }

			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.ECOMMERCE ] }
			/>

			{ /* The "Other sources" tab aggregates events without a provider, so
			     it shows the Key action only. */ }
			{ ! isOtherSourcesTab && (
				<Fragment>
					<TilesGroup
						className="googlesitekit-site-goals-visitor-engagement"
						title={ __(
							'How are your visitors engaging?',
							'google-site-kit'
						) }
						badge={ partialDataBadge }
					>
						<VisitorEngagementTiles
							dates={ dates }
							events={ enabledSecondaryEvents }
							breakdownFilter={ breakdownFilter }
						/>
					</TilesGroup>

					<TilesGroup
						className="googlesitekit-site-goals-goal-drivers-group"
						title={ __(
							'What’s helping you reach your goals?',
							'google-site-kit'
						) }
						headerCTA={ <ChangeGoalDriversLink /> }
						badge={ partialDataBadge }
					>
						<GoalDriverTiles
							drivers={ drivers }
							primaryEvent={ primaryEvent }
							goalType={ GOAL_TYPES.ECOMMERCE }
							breakdownFilter={ breakdownFilter }
						/>
					</TilesGroup>
				</Fragment>
			) }

			<WidgetFeedbackPrompt
				voteID={ SITE_GOALS_VOTE_ID_WIDGET_ONLINE_STORE }
			/>
		</WidgetComponent>
	);
};

export default OnlineStorePerformanceWidget;
