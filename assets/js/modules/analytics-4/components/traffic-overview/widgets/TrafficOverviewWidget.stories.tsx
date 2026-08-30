/**
 * Traffic Overview widget stories.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	getBreakdownReportArgs,
	getGraphReportArgs,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/dashboard/DashboardAllTrafficWidgetGA4/reportOptions';
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import { TRAFFIC_OVERVIEW_WIDGET_SLUG } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import TrafficOverviewWidget from './TrafficOverviewWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	TRAFFIC_OVERVIEW_WIDGET_SLUG
)( TrafficOverviewWidget );

/**
 * Connects Analytics and sets a fixed date range, so `MainDashboard` and
 * `EntityDashboard` start from the same state.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 * @return {void}
 */
function commonSetup( registry: WPDataRegistry ) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
	provideSiteInfo( registry );
	provideUserAuthentication( registry );

	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );
}

/**
 * Puts the Traffic Overview widget's five reports in the store, so a story
 * renders without sending a report request.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to put the reports in.
 * @return {void}
 */
function provideTrafficOverviewReports( registry: WPDataRegistry ) {
	const { startDate, endDate, compareStartDate, compareEndDate } = registry
		.select( CORE_USER )
		.getDateRangeDates( { compare: true } );

	const entityURL = registry.select( CORE_SITE ).getCurrentEntityURL();

	const sharedReportOptions = {
		startDate,
		endDate,
		...( entityURL ? { url: entityURL } : {} ),
	};

	[
		getTotalsReportArgs( {
			...sharedReportOptions,
			compareStartDate,
			compareEndDate,
		} ),
		getGraphReportArgs( sharedReportOptions ),
		...TRAFFIC_BREAKDOWN_COLUMNS.map( ( { dimensionName, reportID } ) =>
			getBreakdownReportArgs( {
				...sharedReportOptions,
				dimensionName,
				reportID,
			} )
		),
	].forEach( ( options ) =>
		provideAnalytics4MockReport( registry, options )
	);
}

interface TrafficOverviewWidgetStoryProps {
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
}

function Template( { setupRegistry }: TrafficOverviewWidgetStoryProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps />
		</WithRegistrySetup>
	);
}

export const MainDashboard = Template.bind( {} ) as Story;
MainDashboard.storyName = 'Main Dashboard';
MainDashboard.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideTrafficOverviewReports( registry );
	},
};
MainDashboard.scenario = {};

/**
 * This story sets no `scenario`, so it runs no visual check. A current entity
 * URL changes only the report requests and the footer link's address, and
 * `useTrafficOverviewReports.test.ts` and `TrafficOverviewSourceLink.test.tsx`
 * already cover both.
 */
export const EntityDashboard = Template.bind( {} ) as Story;
EntityDashboard.storyName = 'Entity Dashboard';
EntityDashboard.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/about/',
		} );
		provideTrafficOverviewReports( registry );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TrafficOverviewWidget',
	component: TrafficOverviewWidget,
};
