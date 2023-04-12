/**
 * WPDashboardPopularPagesGA4 component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Internal dependencies
 */
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import WPDashboardPopularPagesGA4 from './WPDashboardPopularPagesGA4';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../modules/analytics-4/utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../.storybook/utils/zeroReports';
import { provideModules } from '../../../../tests/js/utils';

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	WPDashboardPopularPagesGA4
);

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

function provideGatheringData( registry, value ) {
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( value );
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		const options = WPDashboardPopularPagesGA4.selectReportArgs(
			registry.select
		);

		provideGatheringData( registry, false );
		provideAnalytics4MockReport( registry, options );
	},
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: ( registry ) => {
		provideGatheringData( registry, true );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		const options = WPDashboardPopularPagesGA4.selectReportArgs(
			registry.select
		);
		const report = getAnalytics4MockResponse( options );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options,
		} );
		provideGatheringData( registry, false );
	},
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		const options = WPDashboardPopularPagesGA4.selectReportArgs(
			registry.select
		);
		provideAnalytics4MockReport( registry, options );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ options ] );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry ); // "Data error in {module name}"
		const options = WPDashboardPopularPagesGA4.selectReportArgs(
			registry.select
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ options ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
	},
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardPopularPagesGA4',
	decorators: [
		( Story ) => (
			<WithRegistrySetup
				func={ ( registry ) =>
					registry
						.dispatch( CORE_USER )
						.setReferenceDate( '2021-01-28' )
				}
			>
				<Story />
			</WithRegistrySetup>
		),
		( Story ) => (
			<div id="dashboard-widgets">
				<div
					id="google_dashboard_widget"
					className="postbox"
					style={ { maxWidth: '600px' } }
				>
					<div className="inside">
						<div className="googlesitekit-plugin">
							<div className="googlesitekit-wp-dashboard">
								<Story />
							</div>
						</div>
					</div>
				</div>
			</div>
		),
	],
};
