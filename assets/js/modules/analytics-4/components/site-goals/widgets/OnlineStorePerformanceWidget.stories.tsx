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
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	MODULES_ANALYTICS_4,
	ENUM_CONVERSION_EVENTS,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '@/js/modules/analytics-4/utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '@/js/util/zero-reports';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import OnlineStorePerformanceWidget from './OnlineStorePerformanceWidget';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

// Type for Storybook story exports with custom properties
type Story = {
	( props: never ): JSX.Element;
	storyName?: string;
	args?: { setupRegistry?: ( registry: Registry ) => void };
	scenario?: Record< string, unknown >;
};

// Reference date: 2020-09-07, offsetDays: 0, 28-day range with comparison.
const dates = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
};

function buildPrimaryEventReportOptions( primaryEvent: string ) {
	return {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ { name: 'eventName' } ],
		dimensionFilters: {
			eventName: primaryEvent,
		},
		reportID:
			'analytics-4_online-store-performance-widget_primaryEventReportOptions',
	};
}

const engagementReportOptions = {
	...dates,
	metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
	reportID: 'analytics-4_site-goals_engagementReportOptions',
};

const purchaseReportOptions = buildPrimaryEventReportOptions(
	ENUM_CONVERSION_EVENTS.PURCHASE
);

const addToCartReportOptions = buildPrimaryEventReportOptions(
	ENUM_CONVERSION_EVENTS.ADD_TO_CART
);

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsOnlineStorePerformance'
)( OnlineStorePerformanceWidget );

function commonSetup( registry: Registry ) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );

	provideModuleRegistrations( registry );

	registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '34567' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setWebDataStreamID( '56789' );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

	registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-07' );

	provideKeyMetrics( registry );
}

function Template( {
	setupRegistry,
}: {
	setupRegistry: ( registry: Registry ) => void;
} ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps />
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} ) as Story;
Ready.storyName = 'Ready (Purchase)';
Ready.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );
		provideAnalytics4MockReport( registry, purchaseReportOptions );
		provideAnalytics4MockReport( registry, engagementReportOptions );
	},
};

export const ReadyAddToCart = Template.bind( {} ) as Story;
ReadyAddToCart.storyName = 'Ready (Add to Cart)';
ReadyAddToCart.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );
		provideAnalytics4MockReport( registry, addToCartReportOptions );
		provideAnalytics4MockReport( registry, engagementReportOptions );
	},
};

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ purchaseReportOptions ] );
	},
};

export const ZeroData = Template.bind( {} ) as Story;
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );

		const report = getAnalytics4MockResponse( purchaseReportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: purchaseReportOptions,
		} );

		const sessionsReport = getAnalytics4MockResponse(
			engagementReportOptions
		);
		const zeroSessionsReport =
			replaceValuesInAnalytics4ReportWithZeroData( sessionsReport );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( zeroSessionsReport, {
				options: engagementReportOptions,
			} );
	},
};

export const Error = Template.bind( {} ) as Story;
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );

		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( errorObject, 'getReport', [
				purchaseReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ purchaseReportOptions ] );
	},
};

export const InsufficientPermissions = Template.bind( {} ) as Story;
InsufficientPermissions.storyName = 'Insufficient Permissions';
InsufficientPermissions.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );

		const errorObject = {
			code: 403,
			message: 'Test error message. ',
			data: {
				status: 403,
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( errorObject, 'getReport', [
				purchaseReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ purchaseReportOptions ] );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/OnlineStorePerformanceWidget',
	component: OnlineStorePerformanceWidget,
};
