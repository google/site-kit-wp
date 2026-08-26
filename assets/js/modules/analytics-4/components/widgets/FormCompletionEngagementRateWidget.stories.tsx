/**
 * FormCompletionEngagementRateWidget component stories.
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
import {
	CORE_USER,
	KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { buildEngagementReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '@/js/util/zero-reports';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FormCompletionEngagementRateWidget from './FormCompletionEngagementRateWidget';

const dates = {
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
	startDate: '2020-08-11',
	endDate: '2020-09-07',
};

const engagementReportOptions = buildEngagementReportOptions( dates );

const WidgetWithComponentProps = withWidgetComponentProps(
	KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE
)( FormCompletionEngagementRateWidget );

interface FormCompletionEngagementRateWidgetStoryArgs {
	setupRegistry: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => void;
}

function Template( {
	setupRegistry,
	...args
}: FormCompletionEngagementRateWidgetStoryArgs ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry: Parameters< typeof provideModules >[ 0 ] ) => {
		const report = getAnalytics4MockResponse( engagementReportOptions );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( report, {
			options: engagementReportOptions,
		} );
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
			engagementReportOptions,
		] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( {
		dispatch,
	}: Parameters< typeof provideModules >[ 0 ] ) => {
		const report = getAnalytics4MockResponse( engagementReportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: engagementReportOptions,
		} );
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
			[ engagementReportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			engagementReportOptions,
		] );
	},
};

export default {
	title: 'Key Metrics/FormCompletionEngagementRateWidget',
	decorators: [
		(
			Story: ComponentType,
			{ args }: { args: FormCompletionEngagementRateWidgetStoryArgs }
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

				const [ accountID, propertyID, webDataStreamID ] = [
					'12345',
					'34567',
					'56789',
				];

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( webDataStreamID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
						ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
					] );

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
