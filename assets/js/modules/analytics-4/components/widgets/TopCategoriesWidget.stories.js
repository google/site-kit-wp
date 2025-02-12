/**
 * TopCategoriesWidget Component Stories.
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
	CORE_USER,
	KM_ANALYTICS_TOP_CATEGORIES,
} from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { getAnalytics4MockResponse } from '../../utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../.storybook/utils/zeroReports';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import TopCategoriesWidget from './TopCategoriesWidget';
import { provideCustomDimensionError } from '../../utils/custom-dimensions';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'customEvent:googlesitekit_post_categories' ],
	dimensionFilters: {
		'customEvent:googlesitekit_post_categories': {
			filterType: 'emptyFilter',
			value: '',
			notExpression: false,
		},
	},
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [
		{
			metric: {
				metricName: 'screenPageViews',
			},
			desc: true,
		},
	],
	limit: 3,
};

const propertyID = '12345';

const WidgetWithComponentProps = withWidgetComponentProps(
	KM_ANALYTICS_TOP_CATEGORIES
)( TopCategoriesWidget );

function Template( { setupRegistry, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( { dispatch } ) => {
		const report = getAnalytics4MockResponse( reportOptions );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( report, {
			options: reportOptions,
		} );
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );
	},
};
Ready.scenario = {
	label: 'KeyMetrics/TopCategoriesWidget/Ready',
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions,
		] );
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );
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
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );
	},
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );

		dispatch( MODULES_ANALYTICS_4 ).receiveIsCustomDimensionGatheringData(
			KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
				.requiredCustomDimensions[ 0 ],
			true
		);
	},
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
				reason: 'test-error-reason',
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

		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );
	},
};

export const InsufficientPermissions = Template.bind( {} );
InsufficientPermissions.storyName = 'Insufficient Permissions';
InsufficientPermissions.args = {
	setupRegistry: ( { dispatch } ) => {
		const errorObject = {
			code: 403,
			message: 'Test error message. ',
			data: {
				status: 403,
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
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

		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );
	},
};

export const ErrorMissingCustomDimensions = Template.bind( {} );
ErrorMissingCustomDimensions.storyName = 'Error - Missing custom dimensions';
ErrorMissingCustomDimensions.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );
	},
};

export const ErrorCustomDimensionsInsufficientPermissions = Template.bind( {} );
ErrorCustomDimensionsInsufficientPermissions.storyName =
	'Error - Custom dimensions creation - Insufficient Permissions';
ErrorCustomDimensionsInsufficientPermissions.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );

		provideCustomDimensionError( registry, {
			customDimension:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			error,
		} );
	},
};

export const ErrorCustomDimensionsGeneric = Template.bind( {} );
ErrorCustomDimensionsGeneric.storyName =
	'Error - Custom dimensions creation - Generic';
ErrorCustomDimensionsGeneric.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: 'test-error-reason',
			},
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			],
		} );

		provideCustomDimensionError( registry, {
			customDimension:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
			error,
		} );
	},
};

export default {
	title: 'Key Metrics/TopCategoriesWidget',
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

				provideModuleRegistrations( registry );

				const [ accountID, webDataStreamID ] = [ '12345', '56789' ];

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( webDataStreamID );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
					{
						createTime: '2014-10-02T15:01:23Z',
					},
					{ propertyID }
				);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
							.requiredCustomDimensions[ 0 ],
						false
					);
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
