/**
 * `withCustomDimensions` HOC tests.
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
} from '../../../../../tests/js/test-utils';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import withCustomDimensions from './withCustomDimensions';

describe( 'withCustomDimensions', () => {
	const customDimension = 'test_custom_dimension';
	const TestComponent = () => <div data-testid="component" />;
	const WithCustomDimensionsComponent = withCustomDimensions( {
		dimensions: [ customDimension ],
	} )( TestComponent );

	it( 'renders appropriate error if required custom dimensions are not available', () => {
		const { container } = render( <WithCustomDimensionsComponent />, {
			setupRegistry: ( registry ) => {
				provideUserAuthentication( registry );
				provideUserCapabilities( registry );
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: '123456789',
					availableCustomDimensions: [],
				} );
			},
			features: [ 'newsKeyMetrics' ],
		} );

		expect( container ).toHaveTextContent(
			'Update Analytics to track metric'
		);
	} );

	it( 'renders appropriate error if creating custom dimensions failed due to insufficient permissions', () => {
		const { container } = render( <WithCustomDimensionsComponent />, {
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
						customDimension
					);
			},
			features: [ 'newsKeyMetrics' ],
		} );

		expect( container ).toHaveTextContent( 'Insufficient permissions' );
	} );

	it( 'renders appropriate error if creating custom dimensions failed due to a generic error', () => {
		const { container } = render( <WithCustomDimensionsComponent />, {
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
						customDimension
					);
			},
			features: [ 'newsKeyMetrics' ],
		} );

		expect( container ).toHaveTextContent( 'Analytics update failed' );
	} );

	it( 'renders report correctly if there are no errors', () => {
		const { queryByTestID } = render( <WithCustomDimensionsComponent />, {
			setupRegistry: ( registry ) => {
				provideUserAuthentication( registry );
				provideUserCapabilities( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: '123456789',
					availableCustomDimensions: [ customDimension ],
				} );
			},
			features: [ 'newsKeyMetrics' ],
		} );

		expect( queryByTestID( 'component' ) ).toBeInTheDocument();
	} );
} );
