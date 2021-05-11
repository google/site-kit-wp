/**
 * DashboardUniqueVisitorsWidget Component Stories.
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
 * Internal dependencies
 */
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME } from '../../datastore/constants';
import { provideModules, provideSiteInfo } from '../../../../../../tests/js/utils';
import { getAnalyticsMockResponse } from '../../util/data-mock';
import { withWidgetSlug } from '../../../../googlesitekit/widgets/util/';
import WidgetReportError from '../../../../googlesitekit/widgets/components/WidgetReportError';
import WidgetReportZero from '../../../../googlesitekit/widgets/components/WidgetReportZero';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardUniqueVisitorsWidget from './DashboardUniqueVisitorsWidget';

const currentEntityURL = 'https://www.example.com/example-page/';
const options = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
	dimensions: [ 'ga:date', 'ga:channelGrouping' ],
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Users',
		},
	],
};
const optionsEntityURL = {
	...options,
	url: currentEntityURL,
};
const optionsCompare = {
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
	dimensions: [ 'ga:channelGrouping' ],
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Total Users',
		},
	],
};
const optionsCompareEntityURL = {
	...optionsCompare,
	url: currentEntityURL,
};

const Template = ( args ) => {
	const widgetSlug = 'dashboardUniqueVisitorsWidget';

	return (
		<WithRegistrySetup func={ args?.setupRegistry }>
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<DashboardUniqueVisitorsWidget
						WidgetReportError={ withWidgetSlug( widgetSlug )( WidgetReportError ) }
						WidgetReportZero={ withWidgetSlug( widgetSlug )( WidgetReportZero ) }
					/>
				</div>
			</div>
		</WithRegistrySetup>
	);
};

export const Ready = Template.bind();
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompare ), { options: optionsCompare } );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( options ), { options } );
	},
};

export const Loading = Template.bind();
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompare ), { options: optionsCompare } );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( options ), { options } );
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ options ] );
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ optionsCompare ] );
	},
};

export const DataUnavailable = Template.bind();
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetReport( [], { options } );
	},
};

export const Error = Template.bind();
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};
		registry.dispatch( STORE_NAME ).receiveError( error, 'getReport', [ options ] );
		registry.dispatch( STORE_NAME ).finishResolution( 'getReport', [ options ] );
	},
};

export const LoadedEntityURL = Template.bind();
LoadedEntityURL.storyName = 'Ready with entity URL set';
LoadedEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompareEntityURL ), {
			options: optionsCompareEntityURL,
		} );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsEntityURL ), {
			options: optionsEntityURL,
		} );
	},
};

export const LoadingEntityURL = Template.bind();
LoadingEntityURL.storyName = 'Loading with entity URL set';
LoadingEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompareEntityURL ), {
			options: optionsCompareEntityURL,
		} );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsEntityURL ), {
			options: optionsEntityURL,
		} );
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ optionsEntityURL ] );
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ optionsCompareEntityURL ] );
	},
};

export const DataUnavailableEntityURL = Template.bind();
DataUnavailableEntityURL.storyName = 'Data Unavailable with entity URL set';
DataUnavailableEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		registry.dispatch( STORE_NAME ).receiveGetReport( [], { options: optionsEntityURL } );
	},
};

export const ErrorEntityURL = Template.bind();
ErrorEntityURL.storyName = 'Error with entity URL set';
ErrorEntityURL.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};

		provideSiteInfo( registry, { currentEntityURL } );
		registry.dispatch( STORE_NAME ).receiveError( error, 'getReport', [ optionsEntityURL ] );
		registry.dispatch( STORE_NAME ).finishResolution( 'getReport', [ optionsEntityURL ] );
	},
};

export default {
	title: 'Modules/Analytics/Widgets/DashboardUniqueVisitorsWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideModules( registry, [ {
					active: true,
					connected: true,
					slug: 'analytics',
				} ] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
