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
/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	fireEvent,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '../../../../../tests/js/test-utils';
import { provideCustomDimensionError } from '../utils/custom-dimensions';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../googlesitekit/widgets/util';
import withCustomDimensions from './withCustomDimensions';

describe( 'withCustomDimensions', () => {
	let registry;
	const customDimension = 'test_custom_dimension';
	const propertyID = '123456789';
	const TestComponent = () => <div data-testid="component" />;
	const WithCustomDimensionsComponent = withCustomDimensions( {
		dimensions: [ customDimension ],
	} )( TestComponent );

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData( customDimension, false );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID }
		);
	} );

	it( 'renders appropriate error if required custom dimensions are not available', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );

		const { container } = render( <WithCustomDimensionsComponent />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Update Analytics to track metric'
		);
	} );

	it( 'renders appropriate error if creating custom dimensions failed due to insufficient permissions', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );

		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		provideCustomDimensionError( registry, {
			customDimension,
			error,
		} );

		const { container } = render( <WithCustomDimensionsComponent />, {
			registry,
		} );

		expect( container ).toHaveTextContent( 'Insufficient permissions' );
	} );

	it( 'sets the appropriate `redirectURL` in the permission error object if creating custom dimensions failed due to the user not having `EDIT_SCOPE`', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [ customDimension ],
		} );

		provideUserAuthentication( registry, {
			grantedScopes: [],
		} );

		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		provideCustomDimensionError( registry, {
			customDimension,
			error,
		} );

		const { getByText, getByRole } = render(
			<WithCustomDimensionsComponent />,
			{
				registry,
			}
		);

		expect( getByText( /retry/i ) ).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

		const redirectURL = addQueryArgs( global.location.href, {
			notification: 'custom_dimensions',
		} );

		const permissionScopeError = registry
			.select( CORE_USER )
			.getPermissionScopeError();

		expect( permissionScopeError.data.redirectURL ).toMatch( redirectURL );
	} );

	it( 'renders appropriate error if creating custom dimensions failed due to a generic error', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );

		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: 'test-error-reason',
			},
		};

		provideCustomDimensionError( registry, {
			customDimension,
			error,
		} );

		const { container } = render( <WithCustomDimensionsComponent />, {
			registry,
		} );

		expect( container ).toHaveTextContent( 'Analytics update failed' );
	} );

	it( 'renders gathering data state if GA4 is gathering data', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [ customDimension ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );

		const WidgetWithComponentProps = withWidgetComponentProps(
			'widget-slug'
		)( WithCustomDimensionsComponent );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Setup successful: Analytics is gathering data for this metric'
		);
	} );

	it( 'renders gathering data state if the custom dimension is gathering data', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [ customDimension ],
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData( customDimension, true );

		const WidgetWithComponentProps = withWidgetComponentProps(
			'widget-slug'
		)( WithCustomDimensionsComponent );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Setup successful: Analytics is gathering data for this metric'
		);
	} );

	it( 'renders report correctly if there are no errors', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [ customDimension ],
		} );

		const { queryByTestID } = render( <WithCustomDimensionsComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).toBeInTheDocument();
	} );
} );
