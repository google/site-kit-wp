/**
 * AudienceErrorModal component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { availableAudiences } from '../../../datastore/__fixtures__';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideUserInfo,
	render,
} from '../../../../../../../tests/js/test-utils';
import AudienceErrorModal from './AudienceErrorModal';

describe( 'AudienceErrorModal', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableAudiences,
		} );
	} );

	it( 'should not render if there are no errors', () => {
		const { container } = render( <AudienceErrorModal />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should display the error modal when there is an OAuth error', () => {
		const { getByText, getByRole } = render(
			<AudienceErrorModal hasOAuthError />,
			{
				registry,
			}
		);

		// Verify the error is an OAuth error.
		expect( getByText( /Analytics update failed/i ) ).toBeInTheDocument();

		// Verify the "Get help" link is displayed and points to the correct URL.
		expect( getByText( /get help/i ) ).toBeInTheDocument();
		expect( getByRole( 'link', { name: /get help/i } ) ).toHaveAttribute(
			'href',
			registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: 'access_denied',
			} )
		);

		// Verify the "Retry" button is displayed.
		expect( getByText( /retry/i ) ).toBeInTheDocument();
	} );

	it( 'should display the error modal when there is an insufficient permissions error', () => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		const { getByText, getByRole } = render(
			<AudienceErrorModal apiErrors={ error } />,
			{
				registry,
			}
		);

		// Verify the error is "Insufficient permissions" variant.
		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();

		// Verify the "Get help" link is displayed and points to the correct URL.
		expect( getByText( /get help/i ) ).toBeInTheDocument();
		expect( getByRole( 'link', { name: /get help/i } ) ).toHaveAttribute(
			'href',
			registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: 'analytics-4_insufficient_permissions',
			} )
		);

		// Verify the "Request access" button is displayed and points to the correct URL.
		expect( getByText( /request access/i ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: /request access/i } )
		).toHaveAttribute(
			'href',
			registry.select( MODULES_ANALYTICS_4 ).getServiceEntityAccessURL()
		);
	} );

	it( 'should display the error modal when there is generic error', () => {
		const error = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		};

		const { queryByText, getByText } = render(
			<AudienceErrorModal apiErrors={ error } />,
			{
				registry,
			}
		);

		// Verify the error is a generic error.
		expect(
			getByText( /Failed to set up visitor groups/i )
		).toBeInTheDocument();

		// Verify the "Get help" link is not displayed.
		expect( queryByText( /get help/i ) ).not.toBeInTheDocument();

		// Verify the "Request access" button is not displayed.
		expect( queryByText( /request access/i ) ).not.toBeInTheDocument();
	} );
} );
