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
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { KM_ANALYTICS_POPULAR_AUTHORS } from '../../../../googlesitekit/datastore/user/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import PopularAuthorsWidget from './PopularAuthorsWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	KM_ANALYTICS_POPULAR_AUTHORS
)( PopularAuthorsWidget );

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '123456789',
			availableCustomDimensions: [
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ],
			],
		} );
	},
};
Ready.scenario = {
	label: 'KeyMetrics/PopularAuthorsWidget/Ready',
};
Ready.parameters = {
	features: [ 'newsKeyMetrics' ],
};

export const ErrorMissingCustomDimensions = Template.bind( {} );
ErrorMissingCustomDimensions.storyName = 'Error - Missing custom dimensions';
ErrorMissingCustomDimensions.args = {
	setupRegistry: () => {},
};
ErrorMissingCustomDimensions.scenario = {
	label: 'KeyMetrics/PopularAuthorsWidget/ErrorMissingCustomDimensions',
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

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveCreateCustomDimensionError(
				error,
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ]
			);
	},
};
ErrorCustomDimensionsInsufficientPermissions.scenario = {
	label: 'KeyMetrics/PopularAuthorsWidget/ErrorCustomDimensionsInsufficientPermissions',
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

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveCreateCustomDimensionError(
				error,
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_AUTHORS ]
					.requiredCustomDimensions?.[ 0 ]
			);
	},
};
ErrorCustomDimensionsGeneric.scenario = {
	label: 'KeyMetrics/PopularAuthorsWidget/ErrorCustomDimensionsGeneric',
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
