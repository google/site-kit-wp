/**
 * TopTrafficSourceDrivingPurchasesWidget component stories.
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
 * External dependencies
 */
import { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import { replaceValuesInAnalytics4ReportWithZeroData } from '@/js/util/zero-reports';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import TopTrafficSourceDrivingPurchasesWidget from './TopTrafficSourceDrivingPurchasesWidget';

const detectedEvent = ENUM_CONVERSION_EVENTS.PURCHASE;

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'sessionDefaultChannelGroup' ],
	dimensionFilters: {
		eventName: {
			filterType: 'inListFilter',
			value: [ detectedEvent ],
		},
	},
	metrics: [ { name: 'eventCount' } ],
	orderby: [
		{
			metric: { metricName: 'eventCount' },
			desc: true,
		},
	],
	limit: 6,
	keepEmptyRows: false,
	reportID: 'analytics-4_goal-driver-reports_top-traffic-channels',
};

// Each channel's percentage is its share of every matching event site-wide, so
// the tile asks for that total separately.
const totalReportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensionFilters: {
		eventName: {
			filterType: 'inListFilter',
			value: [ detectedEvent ],
		},
	},
	metrics: [ { name: 'eventCount' } ],
	reportID: 'analytics-4_goal-driver-reports_top-traffic-channels-total',
};

const WidgetWithComponentProps = withWidgetComponentProps(
	'kmAnalyticsTopTrafficSourceDrivingPurchases'
)( TopTrafficSourceDrivingPurchasesWidget );

interface TopTrafficSourceDrivingPurchasesWidgetStoryArgs {
	setupRegistry: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => void;
}

function Template( {
	setupRegistry,
	...args
}: TopTrafficSourceDrivingPurchasesWidgetStoryArgs ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

// The mock generator returns a single channel row, and a total that matches
// its own sum - which would render one row at 100%. These rows are fixed so
// the story shows the ranked list, and shares of the wider site-wide total.
const rankedRows = [
	[ 'Organic Search', 100 ],
	[ 'Direct', 60 ],
	[ 'Referral', 40 ],
].map( ( [ channel, count ] ) => ( {
	dimensionValues: [ { value: channel } ],
	metricValues: [ { value: String( count ) } ],
} ) );

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry: Parameters< typeof provideModules >[ 0 ] ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ rows: rankedRows },
				{ options: reportOptions }
			);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ rows: [ { metricValues: [ { value: '400' } ] } ] },
				{ options: totalReportOptions }
			);
	},
};
Ready.scenario = {};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( {
		dispatch,
	}: Parameters< typeof provideModules >[ 0 ] ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions,
		] );
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			totalReportOptions,
		] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( {
		dispatch,
	}: Parameters< typeof provideModules >[ 0 ] ) => {
		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			replaceValuesInAnalytics4ReportWithZeroData(
				getAnalytics4MockResponse( totalReportOptions )
			),
			{ options: totalReportOptions }
		);
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( {
		dispatch,
	}: Parameters< typeof provideModules >[ 0 ] ) => {
		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			errorObject,
			'getReport',
			[ reportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions,
		] );

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			totalReportOptions,
		] );
	},
};

export const InsufficientPermissions = Template.bind( {} );
InsufficientPermissions.storyName = 'Insufficient Permissions';
InsufficientPermissions.args = {
	setupRegistry: ( {
		dispatch,
	}: Parameters< typeof provideModules >[ 0 ] ) => {
		const errorObject = {
			code: 403,
			message: 'Test error message. ',
			data: {
				status: 403,
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			errorObject,
			'getReport',
			[ reportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions,
		] );

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			totalReportOptions,
		] );
	},
};

export default {
	title: 'Key Metrics/TopTrafficSourceDrivingPurchases',
	decorators: [
		(
			Story: ComponentType,
			{ args }: { args: TopTrafficSourceDrivingPurchasesWidgetStoryArgs }
		) => {
			function setupRegistry(
				registry: Parameters< typeof provideModules >[ 0 ]
			) {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAccountID( '12345' );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( '34567' );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( '56789' );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ detectedEvent ] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-07' );

				provideKeyMetrics( registry );

				// Call story-specific setup.
				args.setupRegistry( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
