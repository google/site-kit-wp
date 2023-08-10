/**
 * TopCountriesWidget component stories.
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import {
	provideKeyMetrics,
	provideModules,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { getAnalytics4MockResponse } from '../../utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../.storybook/utils/zeroReports';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import TopCountriesWidget from './TopCountriesWidget';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'country' ],
	metrics: [ { name: 'totalUsers' } ],
	orderby: [
		{
			metric: {
				metricName: 'totalUsers',
			},
			desc: true,
		},
	],
	limit: 3,
};

const WidgetWithComponentProps = withWidgetComponentProps(
	'kmAnalyticsTopCountries'
)( TopCountriesWidget );

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		const report = getAnalytics4MockResponse( reportOptions );
		// Calculate sum of metricValues for all rows to get the total count
		// visits from all countries in the report.
		const rowsSum = report.rows.reduce( ( total, row ) => {
			return total + Number( row.metricValues[ 0 ].value );
		}, 0 );

		// Generate totalValueForAllCountries that is higher than the sum since
		// the total visits from all countries include those not in the report.
		const totalValueForAllCountries = rowsSum * 2;

		// Adjust totals field in the mock response.
		report.totals = [
			{
				dimensionValues: [ { value: 'RESERVED_TOTAL' } ],
				metricValues: [
					{ value: totalValueForAllCountries.toString() },
				],
			},
		];
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( report, {
			options: reportOptions,
		} );
	},
};
Ready.scenario = {
	label: 'KeyMetrics/TopCountriesWidget/Ready',
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions,
		] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch } ) => {
		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );
	},
};
ZeroData.scenario = {
	label: 'KeyMetrics/TopCountriesWidget/ZeroData',
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( { dispatch } ) => {
		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
			selectorData: {
				storeName: 'modules/analytics-4',
				name: 'getReport',
				args: [ reportOptions ],
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveError(
			errorObject,
			'getReport',
			[ reportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions,
		] );
	},
};
Error.scenario = {
	label: 'KeyMetrics/TopCountriesWidget/Error',
	delay: 250,
};

export default {
	title: 'Key Metrics/TopCountriesWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideKeyMetrics( registry );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
