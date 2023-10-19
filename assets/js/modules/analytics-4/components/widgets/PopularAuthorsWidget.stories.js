/**
 * PopularAuthorsWidget Component Stories.
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
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';
import {
	CORE_USER,
	KM_ANALYTICS_POPULAR_AUTHORS,
} from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { provideModules } from '../../../../../../tests/js/utils';
import { provideCustomDimensionError } from '../../utils/custom-dimensions';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../.storybook/utils/zeroReports';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../utils/data-mock';
import PopularAuthorsWidget from './PopularAuthorsWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	KM_ANALYTICS_POPULAR_AUTHORS
)( PopularAuthorsWidget );

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'customEvent:googlesitekit_post_author' ],
	dimensionFilters: {
		'customEvent:googlesitekit_post_author': {
			filterType: 'stringFilter',
			matchType: 'FULL_REGEXP',
			value: '\\d+',
		},
	},
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [
		{
			metric: { metricName: 'screenPageViews' },
			desc: true,
		},
	],
	limit: 3,
};

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		provideAnalytics4MockReport( registry, reportOptions );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '123456789',
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ],
			],
		} );
	},
};
Ready.parameters = {
	features: [ 'newsKeyMetrics' ],
};
Ready.scenario = {
	label: 'KeyMetrics/PopularAuthorsWidget/Ready',
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions,
		] );
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ],
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
			propertyID: '12345',
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ],
			],
		} );
	},
};
ZeroData.scenario = {
	label: 'KeyMetrics/PopularAuthorsWidget/ZeroData',
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ],
			],
		} );

		dispatch( MODULES_ANALYTICS_4 ).receiveIsCustomDimensionGatheringData(
			KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
				.requiredCustomDimensions?.[ 0 ],
			true
		);
	},
};
GatheringData.scenario = {
	label: 'KeyMetrics/PopularAuthorsWidget/GatheringData',
};

export const ErrorMissingCustomDimensions = Template.bind( {} );
ErrorMissingCustomDimensions.storyName = 'Error - Missing custom dimensions';
ErrorMissingCustomDimensions.args = {
	setupRegistry: () => {},
};
ErrorMissingCustomDimensions.parameters = {
	features: [ 'newsKeyMetrics' ],
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

		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '123456789' );

		provideCustomDimensionError( registry, {
			customDimension:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ],
			error,
		} );
	},
};
ErrorCustomDimensionsInsufficientPermissions.parameters = {
	features: [ 'newsKeyMetrics' ],
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

		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '123456789' );

		provideCustomDimensionError( registry, {
			customDimension:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ],
			error,
		} );
	},
};
ErrorCustomDimensionsGeneric.parameters = {
	features: [ 'newsKeyMetrics' ],
};

export default {
	title: 'Key Metrics/PopularAuthorsWidget',
	component: PopularAuthorsWidget,
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
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
							.requiredCustomDimensions?.[ 0 ],
						false
					);

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
