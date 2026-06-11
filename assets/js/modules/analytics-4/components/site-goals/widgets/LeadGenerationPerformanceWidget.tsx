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
import { Fragment, createInterpolateElement } from '@wordpress/element';
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
import BreakdownTabs, {
	BreakdownTab,
} from '@/js/modules/analytics-4/components/site-goals/components/BreakdownTabs';
import GatheringBreakdownDataBadge from '@/js/modules/analytics-4/components/site-goals/components/GatheringBreakdownDataBadge';
import KeyActionTiles from '@/js/modules/analytics-4/components/site-goals/components/KeyActionTiles';
import OtherSourcesNotice from '@/js/modules/analytics-4/components/site-goals/components/OtherSourcesNotice';
import PartialDataBadge from '@/js/modules/analytics-4/components/site-goals/components/PartialDataBadge';
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import {
	BREAKDOWN_ORIGIN_WIDGET,
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
import BreakdownNoticeArea from '@/js/modules/analytics-4/components/site-goals/notifications/BreakdownNoticeArea';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import { VisitorEngagementTiles } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { FormMetadata } from '@/js/modules/analytics-4/datastore/site-goals-breakdown';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import WidgetFeedbackPrompt from './WidgetFeedbackPrompt';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface LeadGenerationPerformanceWidgetProps extends WidgetComponentProps {
	selectedGoalDriverIDs?: GoalDriverID[];
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
			href={ `${ referenceSiteURL }${ pages[ 0 ] }` }
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
	formMetadata: Record< string, FormMetadata > | undefined,
	formPagePaths: Record< string, string[] > | undefined,
	referenceSiteURL: string,
	learnMoreURL: string
): BreakdownTab[] | undefined {
	// No values → no tabs (an empty array would still render a lone "Other
	// sources" tab). Also wait for titles so labels don't flicker from ID.
	if ( ! breakdownValues?.length || ! formTitles ) {
		return undefined;
	}

	return breakdownValues.map( ( formID ) => ( {
		id: formID,
		label: formTitles[ formID ],
		tooltip: getFormTabTooltip(
			formMetadata?.[ formID ]?.plugin,
			formPagePaths?.[ formID ],
			referenceSiteURL,
			learnMoreURL
		),
	} ) );
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

const LeadGenerationPerformanceWidget: FC<
	LeadGenerationPerformanceWidgetProps
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
				compare: true,
			} ),
		[]
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
		// The form ID dimension is set only on form events, so discovery needs no
		// event scoping (unlike the ecommerce provider dimension); the lead events
		// are only used to detect unattributed "Other sources" data.
	} = useSiteGoalsBreakdown( GOAL_TYPES.LEAD, {
		detectionEventNames: detectedLeadEvents || [],
	} );

	// Only the tabbed breakdown shows the partial-data badge; the badge itself
	// renders nothing unless the dimension is in partial-data state.
	const partialDataBadge = hasBreakdownTabs ? (
		<PartialDataBadge customDimensionSlug={ breakdownDimension } />
	) : undefined;

	const formTitles = useSelect(
		( select: Select ) =>
			breakdownValues
				? select( MODULES_ANALYTICS_4 ).getFormTitles( breakdownValues )
				: undefined,
		[ breakdownValues ]
	) as Record< string, string > | undefined;
	const formMetadata = useSelect(
		( select: Select ) =>
			breakdownValues
				? select( MODULES_ANALYTICS_4 ).getFormMetadata(
						breakdownValues
				  )
				: undefined,
		[ breakdownValues ]
	) as Record< string, FormMetadata > | undefined;

	// Which pages each form appears on, used to pick the tooltip variant.
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
		formMetadata,
		formPagePaths,
		referenceSiteURL,
		keyActionSupportURL
	);

	const { leadEventsReportOptions, engagementReportOptions } =
		getWidgetReportOptions(
			dates,
			detectedLeadEvents || [],
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
				<BreakdownTabs
					tabs={ breakdownTabs }
					activeTabID={ activeTabID }
					onTabChange={ setSelectedTab }
					showOtherSources={ hasOtherSources }
					otherSourcesLabel={ __(
						'Other form completions',
						'google-site-kit'
					) }
				/>
			) }

			{ isOtherSourcesTab && (
				<OtherSourcesNotice learnMoreURL={ keyActionSupportURL } />
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
						supportURL={ keyActionSupportURL }
						rateTitle={ __(
							'Form completion rate',
							'google-site-kit'
						) }
						totalTitle={ __(
							'Total form completions',
							'google-site-kit'
						) }
						totalSubtitle={ getTotalSubtitle( detectedLeadEvents ) }
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
						headerCTA={ <ChangeGoalDriversLink /> }
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
			/>
		</WidgetComponent>
	);
};

export default LeadGenerationPerformanceWidget;
