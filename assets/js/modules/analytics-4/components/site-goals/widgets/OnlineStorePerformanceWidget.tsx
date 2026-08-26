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
import { FC, ReactNode, Ref } from 'react';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
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
import useViewContext from '@/js/hooks/useViewContext';
import ChangeGoalDriversLink from '@/js/modules/analytics-4/components/site-goals/ChangeGoalDriversLink';
import BreakdownTabs from '@/js/modules/analytics-4/components/site-goals/components/BreakdownTabs';
import EventProviderDeactivatedNotice from '@/js/modules/analytics-4/components/site-goals/components/EventProviderDeactivatedNotice';
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
import { useSiteGoalsWidgetViewAction } from '@/js/modules/analytics-4/components/site-goals/hooks/useSiteGoalsWidgetViewAction';
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
import { trackEvent } from '@/js/util';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import WidgetFeedbackPrompt from './WidgetFeedbackPrompt';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface OnlineStorePerformanceWidgetProps extends WidgetComponentProps {
	selectedGoalDriverIDs?: GoalDriverID[];
	/** Set by `withIntersectionObserver` once the widget is in view. */
	hasBeenInView?: boolean;
}

interface DateRange {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
}

const EVENT_RATE_LABELS = {
	purchase: __( 'Sales rate', 'google-site-kit' ),
	add_to_cart: __( 'Add to cart rate', 'google-site-kit' ),
};

const EVENT_TOTAL_LABELS = {
	purchase: __( 'Total sales', 'google-site-kit' ),
	add_to_cart: __( 'Products added to cart', 'google-site-kit' ),
};

/**
 * Builds the chart tile's title from the primary event and the date range.
 *
 * The title opens with the same words `EVENT_TOTAL_LABELS` holds for that
 * event, so the chart tile and the total events tile name the Key action the
 * same way. An event added to `EVENT_TOTAL_LABELS` needs a branch here too,
 * or its chart tile falls back to the sales title.
 *
 * @since n.e.x.t
 *
 * @param {string} primaryEvent  The Key action's event, a key of `EVENT_TOTAL_LABELS`.
 * @param {number} dateRangeDays The number of days the selected date range covers.
 * @return {string} The chart tile's title.
 */
function getChartTitle(
	primaryEvent: keyof typeof EVENT_TOTAL_LABELS,
	dateRangeDays: number
) {
	if ( primaryEvent === 'add_to_cart' ) {
		return sprintf(
			/* translators: %d: number of days in the selected date range, e.g. 28. */
			__(
				'Products added to cart in the last %d days',
				'google-site-kit'
			),
			dateRangeDays
		);
	}

	return sprintf(
		/* translators: %d: number of days in the selected date range, e.g. 28. */
		__( 'Total sales in the last %d days', 'google-site-kit' ),
		dateRangeDays
	);
}

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

const OnlineStorePerformanceWidget = forwardRef<
	HTMLDivElement,
	OnlineStorePerformanceWidgetProps
>(
	(
		{
			Widget,
			WidgetNull,
			WidgetReportError,
			selectedGoalDriverIDs,
			hasBeenInView,
		},
		ref
	) => {
		const WidgetComponent = Widget as FC< {
			ref?: Ref< HTMLDivElement >;
			children?: ReactNode;
			Header?: unknown;
			headerContents?: ReactNode;
			collapsible?: boolean;
			onToggleCollapsed?: ( isCollapsed: boolean ) => void;
		} >;
		const WidgetNullComponent = WidgetNull as FC;
		const WidgetReportErrorComponent = WidgetReportError as FC< {
			moduleSlug: string;
			error: unknown;
			onRetry?: () => void;
			onRequestAccess?: () => void;
		} >;

		const viewContext = useViewContext();
		const widgetEventCategory = `${ viewContext }_site-goals-widget`;

		const handleToggleCollapsed = useCallback(
			( isCollapsed: boolean ) => {
				trackEvent(
					widgetEventCategory,
					isCollapsed ? 'collapse_widget' : 'expand_widget',
					GOAL_TYPES.ECOMMERCE
				);
			},
			[ widgetEventCategory ]
		);

		const handleRetryError = useCallback( () => {
			trackEvent(
				widgetEventCategory,
				'data_loading_error_retry',
				GOAL_TYPES.ECOMMERCE
			);
		}, [ widgetEventCategory ] );

		const handleRequestAccess = useCallback( () => {
			trackEvent(
				widgetEventCategory,
				'insufficient_permissions_error_request_access',
				GOAL_TYPES.ECOMMERCE
			);
		}, [ widgetEventCategory ] );

		const keyActionDocumentationURL = useSelect(
			( select: Select ) =>
				select( CORE_SITE ).getDocumentationLinkURL(
					'site-goals-online-store-key-action'
				),
			[]
		);

		const otherSourcesDocumentationURL = useSelect(
			( select: Select ) =>
				select( CORE_SITE ).getDocumentationLinkURL(
					'site-goals-other-sources'
				),
			[]
		);

		const primaryEvent: keyof typeof EVENT_TOTAL_LABELS | undefined =
			useSelect(
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
		const resolvedVisitorEngagement =
			resolveVisitorEngagementSelectionState(
				effectiveVisitorEngagement ||
					SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT
			);
		const selectedVisitorEngagementEvents =
			resolvedVisitorEngagement[ GOAL_TYPES.ECOMMERCE ];

		const secondaryEcommerceEvents: ( keyof typeof EVENT_TOTAL_LABELS )[] =
			useSelect(
				( select: Select ) =>
					primaryEvent
						? select(
								MODULES_ANALYTICS_4
						  ).getSecondaryEcommerceEvents( primaryEvent )
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

		const dateRangeDays = useSelect(
			( select: Select ) =>
				select( CORE_USER ).getDateRangeNumberOfDays(),
			[]
		) as number;

		// We use `useMemo` here because `[ primaryEvent ]` would be a new array
		// on every render. The chart tile and the "Other sources" metric both
		// count the Key action's own event, and `useSiteGoalsBreakdown` lists
		// this array as a dependency.
		const keyActionEventNames = useMemo(
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
			isBreakdownValueTab,
			hasOtherSources,
			otherSourcesCount,
			otherSourcesPreviousCount,
			breakdownFilter,
		} = useSiteGoalsBreakdown( GOAL_TYPES.ECOMMERCE, {
			// Discovery is scoped to the known ecommerce events. The allowlist
			// then restricts the tabs to supported ecommerce plugins.
			eventNames: CONVERSION_REPORTING_ECOMMERCE_EVENTS,
			detectionEventNames: keyActionEventNames,
			supportedValues: SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDERS,
		} );

		// Only the tabbed breakdown shows the partial-data badge, and only when
		// the dimension is in the partial-data state.
		const partialDataBadge = hasBreakdownTabs ? (
			<PartialDataBadge customDimensionSlug={ breakdownDimension } />
		) : undefined;

		const handleTabChange = useCallback(
			( tabID: string ) => {
				trackEvent(
					widgetEventCategory,
					'breakdown_tab_select',
					tabID
				);
				setSelectedTab( tabID );
			},
			[ widgetEventCategory, setSelectedTab ]
		);

		// The widget's header and tabs area is always in exactly one of four
		// states. `viewAction` resolves which one, so the widget sends a single
		// `view_widget*` event per view.
		const viewAction = useSiteGoalsWidgetViewAction( {
			breakdownDimension,
			hasBreakdownTabs,
		} );
		// `hasBeenInView` comes from the `withIntersectionObserver` wrapper
		// around this widget's export. `viewAction` depends on several async
		// selectors, so the view event waits until `viewAction` resolves.
		const [ hasTrackedView, setHasTrackedView ] = useState( false );

		useEffect( () => {
			if ( hasBeenInView && ! hasTrackedView && viewAction ) {
				trackEvent(
					widgetEventCategory,
					viewAction,
					GOAL_TYPES.ECOMMERCE
				);
				setHasTrackedView( true );
			}
		}, [ hasBeenInView, hasTrackedView, viewAction, widgetEventCategory ] );

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

		useEffect( () => {
			if ( error ) {
				trackEvent(
					widgetEventCategory,
					'data_loading_error',
					GOAL_TYPES.ECOMMERCE
				);
			}
		}, [ error, widgetEventCategory ] );

		if ( ! primaryEvent ) {
			return <WidgetNullComponent />;
		}

		if ( error ) {
			return (
				<WidgetComponent>
					<WidgetReportErrorComponent
						moduleSlug="analytics-4"
						error={ error }
						onRetry={ handleRetryError }
						onRequestAccess={ handleRequestAccess }
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
				ref={ ref }
				onToggleCollapsed={ handleToggleCollapsed }
				Header={ WidgetHeaderTitle }
				headerContents={
					<Fragment>
						<span>
							{ __(
								'Online store performance',
								'google-site-kit'
							) }
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
						onTabChange={ handleTabChange }
						showOtherSources={ hasOtherSources }
						otherSourcesLabel={ __(
							'Other sources',
							'google-site-kit'
						) }
					/>
				) }

				{ isBreakdownValueTab && (
					<EventProviderDeactivatedNotice
						goalType={ GOAL_TYPES.ECOMMERCE }
						providerSlug={ activeTabID }
					/>
				) }

				{ isOtherSourcesTab && (
					<OtherSourcesNotice
						learnMoreURL={ otherSourcesDocumentationURL }
					/>
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
							supportURL={ keyActionDocumentationURL }
							rateTitle={ EVENT_RATE_LABELS[ primaryEvent ] }
							totalTitle={ EVENT_TOTAL_LABELS[ primaryEvent ] }
							totalSubtitle={ sprintf(
								/* translators: %s: GA4 event name */
								__( '“%s” events', 'google-site-kit' ),
								primaryEvent
							) }
							chartTitle={ getChartTitle(
								primaryEvent,
								dateRangeDays
							) }
							currentRate={ currentRate }
							previousRate={ previousRate }
							currentSessions={ currentSessions }
							currentCount={ currentPrimaryCount }
							previousCount={ previousPrimaryCount }
							otherSourcesCount={ otherSourcesCount }
							otherSourcesPreviousCount={
								otherSourcesPreviousCount
							}
							dates={ dates }
							eventNames={ keyActionEventNames }
							goalType={ GOAL_TYPES.ECOMMERCE }
							breakdownFilter={ breakdownFilter }
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
							headerCTA={
								<ChangeGoalDriversLink
									goalType={ GOAL_TYPES.ECOMMERCE }
								/>
							}
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
					goalType={ GOAL_TYPES.ECOMMERCE }
				/>
			</WidgetComponent>
		);
	}
);

OnlineStorePerformanceWidget.displayName = 'OnlineStorePerformanceWidget';

export default withIntersectionObserver( OnlineStorePerformanceWidget );
