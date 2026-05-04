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
import LeadGenerationPerformanceWidget from './LeadGenerationPerformanceWidget';
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

function buildLeadEventsReportOptions( leadEvents: string[] ) {
	return {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ 'eventName' ],
		dimensionFilters: {
			eventName: {
				filterType: 'inListFilter',
				value: leadEvents,
			},
		},
		reportID:
			'analytics-4_lead-generation-performance-widget_widget_leadEventsReportOptions',
	};
}

const engagementReportOptions = {
	...dates,
	metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
	reportID: 'analytics-4_site-goals_engagementReportOptions',
};

const singleEventReportOptions = buildLeadEventsReportOptions( [
	ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
] );

const multipleEventsReportOptions = buildLeadEventsReportOptions( [
	ENUM_CONVERSION_EVENTS.CONTACT,
	ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
] );

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsLeadGenerationPerformance'
)( LeadGenerationPerformanceWidget );

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
		.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

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
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );
		provideAnalytics4MockReport( registry, singleEventReportOptions );
		provideAnalytics4MockReport( registry, engagementReportOptions );
	},
};

export const ReadyMultipleEvents = Template.bind( {} ) as Story;
ReadyMultipleEvents.storyName = 'Ready (Multiple Events)';
ReadyMultipleEvents.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.CONTACT,
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
			] );
		provideAnalytics4MockReport( registry, multipleEventsReportOptions );
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
			.startResolution( 'getReport', [ singleEventReportOptions ] );
	},
};

export const ZeroData = Template.bind( {} ) as Story;
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry: Registry ) => {
		commonSetup( registry );

		const report = getAnalytics4MockResponse( singleEventReportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: singleEventReportOptions,
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
			.receiveError( errorObject, 'getReport', [
				singleEventReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ singleEventReportOptions ] );
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
			.receiveError( errorObject, 'getReport', [
				singleEventReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ singleEventReportOptions ] );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/LeadGenerationPerformanceWidget',
	component: LeadGenerationPerformanceWidget,
};
