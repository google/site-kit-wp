/**
 * AdBlockerWarningWidget Component Stories.
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
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import DashboardTopEarningPagesWidgetGA4 from './DashboardTopEarningPagesWidgetGA4';
import { provideAnalytics4MockReport } from '../../../analytics-4/utils/data-mock';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';

const adSenseAccountID = 'pub-1234567890';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'pageTitle', 'pagePath', 'adSourceName' ],
	metrics: [ { name: 'totalAdRevenue' } ],
	filter: {
		fieldName: 'adSourceName',
		stringFilter: {
			matchType: 'EXACT',
			value: `Google AdSense account (${ adSenseAccountID })`,
		},
	},
	orderBys: [ { metric: { metricName: 'totalAdRevenue' } } ],
	limit: 5,
};

const WidgetWithComponentProps = withWidgetComponentProps(
	'adsenseTopEarningPagesGA4'
)( DashboardTopEarningPagesWidgetGA4 );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.args = {
	setupRegistry: ( registry ) => {
		provideAnalytics4MockReport( registry, reportOptions );
	},
};
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4/Default',
};

export const Loading = Template.bind( {} );
Loading.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ reportOptions ] );
	},
};
Loading.storyName = 'Loading';

export const DataUnavailable = Template.bind( {} );
DataUnavailable.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( [], { options: reportOptions } );
	},
};
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.scenario = {
	label: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4/DataUnavailable',
};

export const ZeroData = Template.bind( {} );
ZeroData.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( [], { options: reportOptions } );
	},
};
ZeroData.storyName = 'Zero Data';
ZeroData.scenario = {
	label: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4/ZeroData',
};

export const AdSenseNotLinked = Template.bind( {} );
AdSenseNotLinked.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( false );
	},
};
AdSenseNotLinked.storyName = 'AdSense Not Linked';
AdSenseNotLinked.scenario = {
	label: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4/AdSenseNotLinked',
};

export const AdBlockerActive = Template.bind( {} );
AdBlockerActive.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveIsAdBlockerActive( true );
	},
};
AdBlockerActive.storyName = 'Ad Blocker Active';
AdBlockerActive.scenario = {
	label: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4/AdBlockerActive',
};

export const Error = Template.bind( {} );
Error.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ reportOptions ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ reportOptions ] );
	},
};
Error.storyName = 'Error';
Error.scenario = {
	label: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4/Error',
};

export default {
	title: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				provideModuleRegistrations( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdSenseLinked( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				registry
					.dispatch( MODULES_ADSENSE )
					.setAccountID( adSenseAccountID );

				args?.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
