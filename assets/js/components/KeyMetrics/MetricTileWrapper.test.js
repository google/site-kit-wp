/**
 * Key Metrics MetricTileWrapper component tests.
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

import {
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '../../../../tests/js/test-utils';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../util/errors';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';
import { KM_ANALYTICS_TOP_CATEGORIES } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import MetricTileTable from './MetricTileTable';

describe( 'MetricTileWrapper', () => {
	const WidgetWithComponentProps = withWidgetComponentProps(
		KM_ANALYTICS_TOP_CATEGORIES
	)( MetricTileTable );

	it( 'renders appropriate error if required custom dimensions are not available', () => {
		const { container } = render(
			<WidgetWithComponentProps moduleSlug="analytics-4" />,
			{
				setupRegistry: ( registry ) => {
					provideUserAuthentication( registry );
					provideUserCapabilities( registry );
					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '123456789',
						availableCustomDimensions: [],
					} );
				},
				features: [ 'newsKeyMetrics' ],
			}
		);

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent(
			'Update Analytics to track metric'
		);
	} );

	it( 'renders appropriate error if creating custom dimensions failed due to insufficient permissions', () => {
		const { container } = render(
			<WidgetWithComponentProps moduleSlug="analytics-4" />,
			{
				setupRegistry: ( registry ) => {
					provideUserAuthentication( registry );
					provideUserCapabilities( registry );

					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '123456789',
						availableCustomDimensions: [],
					} );

					const error = {
						code: 'test-error-code',
						message: 'Test error message',
						data: {
							reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
						},
					};

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveCreateCustomDimensionError(
							error,
							KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
								.requiredCustomDimensions?.[ 0 ]
						);
				},
				features: [ 'newsKeyMetrics' ],
			}
		);

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'Insufficient permissions' );
	} );

	it( 'renders appropriate error if creating custom dimensions failed due to a generic error', () => {
		const { container } = render(
			<WidgetWithComponentProps moduleSlug="analytics-4" />,
			{
				setupRegistry: ( registry ) => {
					provideUserAuthentication( registry );
					provideUserCapabilities( registry );

					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '123456789',
						availableCustomDimensions: [],
					} );

					const error = {
						code: 'test-error-code',
						message: 'Test error message',
						data: {
							reason: 'test-error-reason',
						},
					};

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveCreateCustomDimensionError(
							error,
							KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
								.requiredCustomDimensions?.[ 0 ]
						);
				},
				features: [ 'newsKeyMetrics' ],
			}
		);

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'Analytics update failed' );
	} );

	it( 'renders report correctly if there are no errors', () => {
		const { container } = render(
			<WidgetWithComponentProps
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
			/>,
			{
				setupRegistry: ( registry ) => {
					provideUserAuthentication( registry );
					provideUserCapabilities( registry );

					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '123456789',
						availableCustomDimensions: [
							'googlesitekit_post_categories',
						],
					} );
				},
				features: [ 'newsKeyMetrics' ],
			}
		);

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'keyword1' );
	} );
} );
