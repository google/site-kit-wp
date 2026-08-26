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
	createInterpolateElement,
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
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
import useViewContext from '@/js/hooks/useViewContext';
import ChangeGoalDriversLink from '@/js/modules/analytics-4/components/site-goals/ChangeGoalDriversLink';
import BreakdownTabs, {
	BreakdownTab,
} from '@/js/modules/analytics-4/components/site-goals/components/BreakdownTabs';
import EventProviderDeactivatedNotice from '@/js/modules/analytics-4/components/site-goals/components/EventProviderDeactivatedNotice';
import GatheringBreakdownDataBadge from '@/js/modules/analytics-4/components/site-goals/components/GatheringBreakdownDataBadge';
import KeyActionTiles from '@/js/modules/analytics-4/components/site-goals/components/KeyActionTiles';
import OtherSourcesNotice from '@/js/modules/analytics-4/components/site-goals/components/OtherSourcesNotice';
import PartialDataBadge from '@/js/modules/analytics-4/components/site-goals/components/PartialDataBadge';
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import {
	BREAKDOWN_ORIGIN_WIDGET,
	SITE_GOALS_BREAKDOWN_LEAD_PROVIDER_LABELS,
	SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
	SITE_GOALS_VOTE_ID_WIDGET_LEAD_GENERATION,
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
import { VisitorEngagementTiles } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { trackEvent, untrailingslashit } from '@/js/util';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import WidgetFeedbackPrompt from './WidgetFeedbackPrompt';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface LeadGenerationPerformanceWidgetProps extends WidgetComponentProps {
	selectedGoalDriverIDs?: GoalDriverID[];
	/** Set by `withIntersectionObserver` once the widget is in view. */
	hasBeenInView?: boolean;
}

// Builds the info-tooltip for a form tab. Has three variants depending on how
// many pages the form was seen on, and falls back to the plugin-only variant
// while the page report is still resolving (so a hover never shows nothing).
function getFormTabTooltip(
	plugin: string | null | undefined,
	pages: string[] | undefined,
	referenceSiteURL: string,
	learnMoreURL: string
): ReactNode {
	if ( ! plugin ) {
		return undefined;
	}

	const learnMore = (
		// Content is added via createInterpolateElement.
		// eslint-disable-next-line jsx-a11y/anchor-has-content
		<a href={ learnMoreURL } target="_blank" rel="noreferrer noopener" />
	);

	// No (or not-yet-resolved) pages: plugin only.
	if ( ! pages?.length ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: name of the plugin that created the form (e.g. "WPForms"). */
				__(
					'This form was created with <strong>%s</strong>. <a>Learn more</a> about Plugin conversion tracking.',
					'google-site-kit'
				),
				plugin
			),
			{ strong: <strong />, a: learnMore }
		);
	}

	const pageLink = (
		// Content is added via createInterpolateElement.
		// eslint-disable-next-line jsx-a11y/anchor-has-content
		<a
			// The page path always starts with a slash, so strip the site URL's
			// trailing one to avoid a double slash.
			href={ `${ untrailingslashit( referenceSiteURL ) }${ pages[ 0 ] }` }
			target="_blank"
			rel="noreferrer noopener"
		/>
	);

	// A single page: link straight to it. Multiple pages: link to the busiest
	// one but flag it as an example.
	const template =
		pages.length === 1
			? /* translators: %s: name of the plugin that created the form (e.g. "WPForms"). */
			  __(
					'This form was created with <strong>%s</strong> and appears on this <page>page</page>. <a>Learn more</a> about Plugin conversion tracking.',
					'google-site-kit'
			  )
			: /* translators: %s: name of the plugin that created the form (e.g. "WPForms"). */
			  __(
					'This form was created with <strong>%s</strong> and appears on this <page>page</page> as an example. <a>Learn more</a> about Plugin conversion tracking.',
					'google-site-kit'
			  );

	return createInterpolateElement( sprintf( template, plugin ), {
		strong: <strong />,
		page: pageLink,
		a: learnMore,
	} );
}

// Builds the per-form tabs. Returns undefined until both the form IDs and their
// titles have resolved, so tab labels don't flicker from ID to title.
function getFormBreakdownTabs(
	breakdownValues: string[] | undefined,
	formTitles: Record< string, string > | undefined,
	formProviders: Record< string, string > | undefined,
	formPagePaths: Record< string, string[] > | undefined,
	referenceSiteURL: string,
	learnMoreURL: string
): BreakdownTab[] | undefined {
	// No values → no tabs (an empty array would still render a lone "Other
	// sources" tab). Also wait for titles so labels don't flicker from ID.
	if ( ! breakdownValues?.length || ! formTitles ) {
		return undefined;
	}

	return breakdownValues.map( ( formID ) => {
		// The provider slug comes straight off the event's
		// `googlesitekit_event_provider` dimension; map it to the plugin's
		// display name for the tooltip.
		const providerSlug = formProviders?.[ formID ];
		const plugin = providerSlug
			? SITE_GOALS_BREAKDOWN_LEAD_PROVIDER_LABELS[ providerSlug ]
			: undefined;

		return {
			id: formID,
			label: formTitles[ formID ],
			tooltip: getFormTabTooltip(
				plugin,
				formPagePaths?.[ formID ],
				referenceSiteURL,
				learnMoreURL
			),
		};
	} );
}

// The single/plural subtitle for the Total form completions tile.
function getTotalSubtitle( detectedLeadEvents: string[] ): string {
	if ( detectedLeadEvents.length === 1 ) {
		return sprintf(
			/* translators: %s: GA4 event name */
			__( '“%s” events', 'google-site-kit' ),
			detectedLeadEvents[ 0 ]
		);
	}

	return sprintf(
		/* translators: %d: number of detected event types */
		_n(
			'%d event type',
			'%d event types',
			detectedLeadEvents.length,
			'google-site-kit'
		),
		detectedLeadEvents.length
	);
}

function getWidgetReportOptions(
	dates: {
		startDate: string;
		endDate: string;
		compareStartDate?: string;
		compareEndDate?: string;
	},
	detectedLeadEvents: string[],
	breakdownFilter?: Record< string, unknown >
): {
	leadEventsReportOptions: ReportOptions | null;
	engagementReportOptions: ReportOptions | null;
} {
	if ( ! detectedLeadEvents.length ) {
		return {
			leadEventsReportOptions: null,
			engagementReportOptions: null,
		};
	}

	return {
		leadEventsReportOptions: {
			...dates,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: detectedLeadEvents,
				},
				// Scopes the Key action to the selected breakdown tab.
				...breakdownFilter,
			},
			reportID:
				'analytics-4_lead-generation-performance-widget_widget_leadEventsReportOptions',
		} as ReportOptions,
		engagementReportOptions: {
			...dates,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			...( breakdownFilter ? { dimensionFilters: breakdownFilter } : {} ),
			reportID: 'analytics-4_site-goals_engagementReportOptions',
		} as ReportOptions,
	};
}

const LeadGenerationPerformanceWidget = forwardRef<
	HTMLDivElement,
	LeadGenerationPerformanceWidgetProps
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
					GOAL_TYPES.LEAD
				);
			},
			[ widgetEventCategory ]
		);

		const handleRetryError = useCallback( () => {
			trackEvent(
				widgetEventCategory,
				'data_loading_error_retry',
				GOAL_TYPES.LEAD
			);
		}, [ widgetEventCategory ] );

		const handleRequestAccess = useCallback( () => {
			trackEvent(
				widgetEventCategory,
				'insufficient_permissions_error_request_access',
				GOAL_TYPES.LEAD
			);
		}, [ widgetEventCategory ] );

		const keyActionDocumentationURL = useSelect(
			( select: Select ) =>
				select( CORE_SITE ).getDocumentationLinkURL(
					'site-goals-lead-generation-key-action'
				),
			[]
		);

		const otherFormCompletionsDocumentationURL = useSelect(
			( select: Select ) =>
				select( CORE_SITE ).getDocumentationLinkURL(
					'site-goals-other-form-completions'
				),
			[]
		);

		const pluginConversionTrackingDocumentationURL = useSelect(
			( select: Select ) =>
				select( CORE_SITE ).getDocumentationLinkURL(
					'plugin-conversion-tracking'
				),
			[]
		);

		const detectedLeadEvents = useSelect(
			( select: Select ) =>
				select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
			[]
		);

		// We use `useMemo` here instead of a plain `|| []`, because
		// `getDetectedLeadEvents` returns `undefined` until the events load. A
		// new empty array on every render would make `useSiteGoalsBreakdown`
		// and `KeyActionChartTile` run their report selectors again for the
		// same events.
		const keyActionEventNames: string[] = useMemo(
			() => detectedLeadEvents || [],
			[ detectedLeadEvents ]
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
					compare: true,
				} ),
			[]
		);

		const dateRangeDays = useSelect(
			( select: Select ) =>
				select( CORE_USER ).getDateRangeNumberOfDays(),
			[]
		) as number;

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
			// The form ID dimension is set only on form events, so discovery
			// needs no event scoping. The lead events only detect unattributed
			// "Other sources" data.
		} = useSiteGoalsBreakdown( GOAL_TYPES.LEAD, {
			detectionEventNames: keyActionEventNames,
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
				trackEvent( widgetEventCategory, viewAction, GOAL_TYPES.LEAD );
				setHasTrackedView( true );
			}
		}, [ hasBeenInView, hasTrackedView, viewAction, widgetEventCategory ] );

		const formTitles = useSelect(
			( select: Select ) =>
				breakdownValues
					? select( MODULES_ANALYTICS_4 ).getFormTitles(
							breakdownValues
					  )
					: undefined,
			[ breakdownValues ]
		) as Record< string, string > | undefined;

		const formProviders = useInViewSelect(
			( select: Select ) =>
				breakdownValues?.length
					? select( MODULES_ANALYTICS_4 ).getFormProviders(
							breakdownDimension,
							breakdownValues
					  )
					: undefined,
			[ breakdownDimension, breakdownValues ]
		) as Record< string, string > | undefined;

		// These are the pages each form appears on. The widget uses them to
		// pick the tooltip variant.
		const formPagePaths = useInViewSelect(
			( select: Select ) =>
				breakdownValues?.length
					? select( MODULES_ANALYTICS_4 ).getFormPagePaths(
							breakdownDimension,
							breakdownValues
					  )
					: undefined,
			[ breakdownDimension, breakdownValues ]
		) as Record< string, string[] > | undefined;

		const referenceSiteURL = useSelect(
			( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
			[]
		) as string;

		const breakdownTabs = getFormBreakdownTabs(
			breakdownValues,
			formTitles,
			formProviders,
			formPagePaths,
			referenceSiteURL,
			pluginConversionTrackingDocumentationURL
		);

		const { leadEventsReportOptions, engagementReportOptions } =
			getWidgetReportOptions(
				dates,
				keyActionEventNames,
				breakdownFilter
			);

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

		useEffect( () => {
			if ( error ) {
				trackEvent(
					widgetEventCategory,
					'data_loading_error',
					GOAL_TYPES.LEAD
				);
			}
		}, [ error, widgetEventCategory ] );

		if ( ! hasLeadEvents ) {
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
		} = processReports( leadEventsReport, engagementReport, {
			aggregate: true,
		} );

		return (
			<WidgetComponent
				ref={ ref }
				onToggleCollapsed={ handleToggleCollapsed }
				Header={ WidgetHeaderTitle }
				headerContents={
					<Fragment>
						<span>
							{ __(
								'Lead generation performance',
								'google-site-kit'
							) }
						</span>
						<GatheringBreakdownDataBadge
							goalType={ GOAL_TYPES.LEAD }
							variant="widget"
						/>
					</Fragment>
				}
				collapsible
			>
				{ breakdownTabs && (
					<Fragment>
						<BreakdownTabs
							tabs={ breakdownTabs }
							activeTabID={ activeTabID }
							onTabChange={ handleTabChange }
							showOtherSources={ hasOtherSources }
							otherSourcesLabel={ __(
								'Other form completions',
								'google-site-kit'
							) }
						/>

						{ isBreakdownValueTab && (
							<EventProviderDeactivatedNotice
								goalType={ GOAL_TYPES.LEAD }
								providerSlug={ formProviders?.[ activeTabID ] }
							/>
						) }
					</Fragment>
				) }

				{ isOtherSourcesTab && (
					<OtherSourcesNotice
						learnMoreURL={ otherFormCompletionsDocumentationURL }
					/>
				) }

				{ loading ? (
					<PreviewBlock width="100%" height="130px" />
				) : (
					<TilesGroup
						className="googlesitekit-site-goals-primary-action"
						title={ __( 'Key action', 'google-site-kit' ) }
						badge={ partialDataBadge }
					>
						<KeyActionTiles
							isOtherSourcesTab={ isOtherSourcesTab }
							supportURL={ keyActionDocumentationURL }
							rateTitle={ __(
								'Form completion rate',
								'google-site-kit'
							) }
							totalTitle={ __(
								'Total form completions',
								'google-site-kit'
							) }
							totalSubtitle={ getTotalSubtitle(
								detectedLeadEvents
							) }
							chartTitle={ sprintf(
								/* translators: %d: number of days in the selected date range, e.g. 28. */
								__(
									'Total form completions in the last %d days',
									'google-site-kit'
								),
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
							goalType={ GOAL_TYPES.LEAD }
							breakdownFilter={ breakdownFilter }
						/>
					</TilesGroup>
				) }

				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_WIDGET }
					goalTypes={ [ GOAL_TYPES.LEAD ] }
				/>

				{ /* The "Other sources" tab aggregates events without a form ID, so
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
									goalType={ GOAL_TYPES.LEAD }
								/>
							}
							badge={ partialDataBadge }
						>
							<GoalDriverTiles
								drivers={ drivers }
								primaryEvent={ detectedLeadEvents }
								goalType={ GOAL_TYPES.LEAD }
								breakdownFilter={ breakdownFilter }
							/>
						</TilesGroup>
					</Fragment>
				) }

				<WidgetFeedbackPrompt
					voteID={ SITE_GOALS_VOTE_ID_WIDGET_LEAD_GENERATION }
					goalType={ GOAL_TYPES.LEAD }
				/>
			</WidgetComponent>
		);
	}
);

LeadGenerationPerformanceWidget.displayName = 'LeadGenerationPerformanceWidget';

export default withIntersectionObserver( LeadGenerationPerformanceWidget );
