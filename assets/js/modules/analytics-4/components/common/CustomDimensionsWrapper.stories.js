/**
 * CustomDimensionsWrapper Component Stories.
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
import { KM_ANALYTICS_TOP_CATEGORIES } from '../../../../googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import CustomDimensionsWrapper from './CustomDimensionsWrapper';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { MetricTileTable } from '../../../../components/KeyMetrics';

const { Widget } = getWidgetComponentProps( KM_ANALYTICS_TOP_CATEGORIES );

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<CustomDimensionsWrapper
			widgetSlug={ KM_ANALYTICS_TOP_CATEGORIES }
			{ ...args }
		>
			<MetricTileTable
				widgetSlug={ KM_ANALYTICS_TOP_CATEGORIES }
				Widget={ Widget }
				moduleSlug="analytics-4"
				rows={ [
					{
						field1: [ 'keyword1' ],
						field2: 0.112,
					},
					{
						field1: [ 'keyword2' ],
						field2: 0.212,
					},
					{
						field1: [ 'keyword3' ],
						field2: 0.312,
					},
				] }
				columns={ [
					{
						field: 'field1.0',
						Component: ( { fieldValue } ) => (
							<a href="http://example.com">{ fieldValue }</a>
						),
					},
					{
						field: 'field2',
						Component: ( { fieldValue } ) => (
							<strong>{ fieldValue }</strong>
						),
					},
				] }
			/>
		</CustomDimensionsWrapper>
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	rows: [
		{
			field1: [ 'keyword1' ],
			field2: 0.112,
		},
		{
			field1: [ 'keyword2' ],
			field2: 0.212,
		},
		{
			field1: [ 'keyword3' ],
			field2: 0.312,
		},
	],
	columns: [
		{
			field: 'field1.0',
			Component: ( { fieldValue } ) => (
				<a href="http://example.com">{ fieldValue }</a>
			),
		},
		{
			field: 'field2',
			Component: ( { fieldValue } ) => <strong>{ fieldValue }</strong>,
		},
	],
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '123456789',
			availableCustomDimensions: [ 'googlesitekit_post_categories' ],
		} );
	},
};
Ready.scenario = {
	label: 'KeyMetrics/CustomDimensionsWrapper/Ready',
};
Ready.parameters = {
	features: [ 'newsKeyMetrics' ],
};

export const ErrorMissingCustomDimensions = Template.bind( {} );
ErrorMissingCustomDimensions.storyName = 'Error - Missing custom dimensions';
ErrorMissingCustomDimensions.scenario = {
	label: 'KeyMetrics/CustomDimensionsWrapper/ErrorMissingCustomDimensions',
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
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions?.[ 0 ]
			);
	},
};
ErrorCustomDimensionsInsufficientPermissions.scenario = {
	label: 'KeyMetrics/CustomDimensionsWrapper/ErrorCustomDimensionsInsufficientPermissions',
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
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions?.[ 0 ]
			);
	},
};
ErrorCustomDimensionsGeneric.scenario = {
	label: 'KeyMetrics/CustomDimensionsWrapper/ErrorCustomDimensionsGeneric',
};
ErrorCustomDimensionsGeneric.parameters = {
	features: [ 'newsKeyMetrics' ],
};

export default {
	title: 'Key Metrics/CustomDimensionsWrapper',
	component: CustomDimensionsWrapper,
	args: {
		setupRegistry: () => {},
	},
};
