/**
 * WPDashboardWidgets component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import WPDashboardImpressions from './WPDashboardImpressions';
import WPDashboardClicks from './WPDashboardClicks';
import WPDashboardUniqueVisitors from './WPDashboardUniqueVisitors';
import WPDashboardSessionDuration from './WPDashboardSessionDuration';
import WPDashboardPopularPages from './WPDashboardPopularPages';
import WPDashboardIdeaHub from './WPDashboardIdeaHub';
import WPDashboardActivateAnalyticsCTA from './WPDashboardActivateAnalyticsCTA';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import {
	SPECIAL_WIDGET_STATES,
	HIDDEN_CLASS,
} from '../../googlesitekit/widgets/util/constants';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util/get-widget-component-props';
import { useFeature } from '../../hooks/useFeature';
const { useSelect } = Data;

// Widget slugs.
const WIDGET_IMPRESSIONS = 'wpDashboardImpressions';
const WIDGET_CLICKS = 'wpDashboardClicks';
const WIDGET_VISITORS = 'wpDashboardUniqueVisitors';
const WIDGET_SESSION_DURATION = 'wpDashboardSessionDuration';
const WIDGET_POPULAR_PAGES = 'wpDashboardPopularPages';

// Search Console widgets.
const WPDashboardImpressionsWidget = withWidgetComponentProps(
	WIDGET_IMPRESSIONS
)( WPDashboardImpressions );
const WPDashboardClicksWidget = withWidgetComponentProps( WIDGET_CLICKS )(
	WPDashboardClicks
);

// Analytics Widgets.
const WPDashboardUniqueVisitorsWidget = withWidgetComponentProps(
	WIDGET_VISITORS
)( WPDashboardUniqueVisitors );
const WPDashboardSessionDurationWidget = withWidgetComponentProps(
	WIDGET_SESSION_DURATION
)( WPDashboardSessionDuration );
const WPDashboardPopularPagesWidget = withWidgetComponentProps(
	WIDGET_POPULAR_PAGES
)( WPDashboardPopularPages );

// Special widget states.
const [
	ActivateModuleCTA,
	CompleteModuleActivationCTA,
	ReportZero,
] = SPECIAL_WIDGET_STATES;

const WPDashboardWidgets = () => {
	const analyticsModule = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'analytics' )
	);
	const analyticsModuleActive = analyticsModule?.active;
	const analyticsModuleConnected = analyticsModule?.connected;
	const analyticsModuleActiveAndConnected =
		analyticsModuleActive && analyticsModuleConnected;

	// The two Analytics widgets at the top can be combined (i.e. the second can be hidden)
	// if they are both ReportZero.
	const shouldCombineAnalyticsArea1 = useSelect(
		( select ) =>
			select( CORE_WIDGETS ).getWidgetState( WIDGET_VISITORS )
				?.Component === ReportZero &&
			select( CORE_WIDGETS ).getWidgetState( WIDGET_SESSION_DURATION )
				?.Component === ReportZero
	);

	// The Analytics widget at the bottom can be combined / hidden if one of the two at the top
	// is also ReportZero.
	const shouldCombineAnalyticsArea2 = useSelect(
		( select ) =>
			( select( CORE_WIDGETS ).getWidgetState( WIDGET_VISITORS )
				?.Component === ReportZero &&
				select( CORE_WIDGETS ).getWidgetState( WIDGET_POPULAR_PAGES )
					?.Component === ReportZero ) ||
			( select( CORE_WIDGETS ).getWidgetState( WIDGET_SESSION_DURATION )
				?.Component === ReportZero &&
				select( CORE_WIDGETS ).getWidgetState( WIDGET_POPULAR_PAGES )
					?.Component === ReportZero )
	);

	// The Search Console widgets can be combined (i.e. the second is hidden) if they are both
	// ReportZero.
	const shouldCombineSearchConsoleWidgets = useSelect(
		( select ) =>
			select( CORE_WIDGETS ).getWidgetState( WIDGET_IMPRESSIONS )
				?.Component === ReportZero &&
			select( CORE_WIDGETS ).getWidgetState( WIDGET_CLICKS )
				?.Component === ReportZero
	);

	const zeroDataStates = useFeature( 'zeroDataStates' );

	if (
		analyticsModule === undefined ||
		shouldCombineAnalyticsArea1 === undefined ||
		shouldCombineAnalyticsArea2 === undefined ||
		shouldCombineSearchConsoleWidgets === undefined
	) {
		return null;
	}

	return (
		<div
			className={ classnames( 'googlesitekit-wp-dashboard-stats', {
				'googlesitekit-wp-dashboard-stats--fourup':
					analyticsModuleActive && analyticsModuleConnected,
				'googlesitekit-wp-dashboard-stats--twoup': zeroDataStates,
			} ) }
		>
			<WPDashboardIdeaHub />

			{ analyticsModuleActiveAndConnected && (
				<Fragment>
					<WPDashboardUniqueVisitorsWidget />
					{ ! shouldCombineAnalyticsArea1 && (
						<WPDashboardSessionDurationWidget />
					) }
				</Fragment>
			) }

			<Fragment>
				<WPDashboardImpressionsWidget />
				{ ! shouldCombineSearchConsoleWidgets && (
					<WPDashboardClicksWidget />
				) }
			</Fragment>

			{ ( ! analyticsModuleConnected || ! analyticsModuleActive ) && (
				<div className="googlesitekit-wp-dashboard-stats__cta">
					{ ! analyticsModuleActive &&
						( zeroDataStates ? (
							<WPDashboardActivateAnalyticsCTA />
						) : (
							<ActivateModuleCTA moduleSlug="analytics" />
						) ) }
					{ analyticsModuleActive &&
						( zeroDataStates ? (
							<WPDashboardActivateAnalyticsCTA
								isCompleteSetup={ true }
							/>
						) : (
							<CompleteModuleActivationCTA moduleSlug="analytics" />
						) ) }
				</div>
			) }

			{ analyticsModuleActiveAndConnected &&
				! shouldCombineAnalyticsArea2 && (
					<WPDashboardPopularPagesWidget />
				) }

			{ ( shouldCombineSearchConsoleWidgets ||
				shouldCombineAnalyticsArea1 ||
				shouldCombineAnalyticsArea2 ) && (
				<div className={ HIDDEN_CLASS }>
					{ shouldCombineSearchConsoleWidgets && (
						<WPDashboardClicksWidget />
					) }
					{ analyticsModuleActiveAndConnected &&
						shouldCombineAnalyticsArea1 && (
							<WPDashboardSessionDurationWidget />
						) }
					{ analyticsModuleActiveAndConnected &&
						shouldCombineAnalyticsArea2 && (
							<WPDashboardPopularPagesWidget />
						) }
				</div>
			) }
		</div>
	);
};

export default WPDashboardWidgets;
