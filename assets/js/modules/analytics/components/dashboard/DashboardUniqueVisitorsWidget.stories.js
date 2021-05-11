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
import { CORE_WIDGETS, WIDGET_WIDTHS, WIDGET_AREA_STYLES } from '../../../../googlesitekit/widgets/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { accountsPropertiesProfiles } from '../../datastore/__fixtures__';
import { STORE_NAME } from '../../datastore/constants';
import { provideModules, provideSiteInfo } from '../../../../../../tests/js/utils';
import { getAnalyticsMockResponse } from '../../util/data-mock';
import WidgetAreaRenderer from '../../../../googlesitekit/widgets/components/WidgetAreaRenderer';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardUniqueVisitorsWidget from './DashboardUniqueVisitorsWidget';

const areaName = 'moduleAnalyticsMain';
const widgetSlug = 'analyticsUniqueVisitors';
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
const WidgetAreaTemplate = ( args ) => {
	return (
		<WithRegistrySetup func={ args?.setupRegistry }>
			<WidgetAreaRenderer slug={ areaName } />
		</WithRegistrySetup>
	);
};

export const Loaded = WidgetAreaTemplate.bind();
Loaded.storyName = 'Ready';
Loaded.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompare ), { options: optionsCompare } );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( options ), { options } );
	},
};

export const Loading = WidgetAreaTemplate.bind();
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompare ), { options: optionsCompare } );
		registry.dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( options ), { options } );
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ options ] );
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ optionsCompare ] );
	},
};

export const DataUnavailable = WidgetAreaTemplate.bind();
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetReport( [], { options } );
	},
};

export const Error = WidgetAreaTemplate.bind();
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

export const LoadedEntityURL = WidgetAreaTemplate.bind();
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

export const LoadingEntityURL = WidgetAreaTemplate.bind();
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

export const DataUnavailableEntityURL = WidgetAreaTemplate.bind();
DataUnavailableEntityURL.storyName = 'Data Unavailable with entity URL set';
DataUnavailableEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		registry.dispatch( STORE_NAME ).receiveGetReport( [], { options: optionsEntityURL } );
	},
};

export const ErrorEntityURL = WidgetAreaTemplate.bind();
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
				const [ property ] = accountsPropertiesProfiles.properties;
				registry.dispatch( STORE_NAME ).receiveGetSettings( {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: property.accountId,
					// eslint-disable-next-line sitekit/acronym-case
					internalWebPropertyID: property.internalWebPropertyId,
					// eslint-disable-next-line sitekit/acronym-case
					profileID: property.defaultProfileId,
				} );

				registry.dispatch( CORE_WIDGETS ).registerWidgetArea( areaName, {
					title: 'Overview',
					style: WIDGET_AREA_STYLES.BOXES,
				} );
				registry.dispatch( CORE_WIDGETS ).registerWidget( widgetSlug, {
					Component: DashboardUniqueVisitorsWidget,
					width: WIDGET_WIDTHS.FULL,
				} );
				registry.dispatch( CORE_WIDGETS ).assignWidget( widgetSlug, areaName );
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
