/**
 * AnalyticsAccountCreationErrorNotice component tests.
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
} from '../../../../../../../tests/js/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import AnalyticsAccountCreationErrorNotice from './AnalyticsAccountCreationErrorNotice';

describe( 'AnalyticsAccountCreationErrorNotice', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	describe( 'user_cancel', () => {
		it( 'should render the terms of service not accepted variant', () => {
			const onRetry = jest.fn();
			const { getByRole, getByText } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="user_cancel"
					onRetry={ onRetry }
				/>,
				{ registry }
			);

			expect(
				getByText( 'Analytics account creation failed' )
			).toBeInTheDocument();

			expect(
				getByText(
					'Creating a new Analytics account failed because the Terms of Service were not accepted. Go to Analytics to accept the Terms of Service.'
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: /go to analytics/i } )
			).toBeInTheDocument();
		} );

		it( 'should call global.history.back when the Go to Analytics button is clicked', () => {
			const backSpy = jest
				.spyOn( global.history, 'back' )
				.mockImplementation( () => {} );

			const { getByRole } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="user_cancel"
					onRetry={ () => {} }
				/>,
				{ registry }
			);

			fireEvent.click(
				getByRole( 'button', { name: /go to analytics/i } )
			);

			expect( backSpy ).toHaveBeenCalled();

			backSpy.mockRestore();
		} );
	} );

	describe( 'max_accounts_reached', () => {
		it( 'should render with a get help link', () => {
			const expectedHelpURL = registry
				.select( CORE_SITE )
				.getGoogleSupportURL( {
					path: '/analytics/',
					hash: 'topic=14090456',
				} );

			const onRetry = jest.fn();
			const { getByRole, getByText } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="max_accounts_reached"
					onRetry={ onRetry }
				/>,
				{ registry }
			);

			expect(
				getByText( 'Analytics account creation failed' )
			).toBeInTheDocument();

			expect(
				getByText(
					'Creating a new Analytics account failed because the Analytics account limit has been reached. Try again or'
				)
			).toBeInTheDocument();

			const getHelpLink = getByRole( 'link', { name: /get help/i } );
			expect( getHelpLink ).toHaveAttribute( 'href', expectedHelpURL );

			expect(
				getByRole( 'button', { name: /^retry$/i } )
			).toBeInTheDocument();
		} );

		it( 'should call onRetry when the Retry button is clicked', () => {
			const onRetry = jest.fn();

			const { getByRole } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="max_accounts_reached"
					onRetry={ onRetry }
				/>,
				{ registry }
			);

			fireEvent.click( getByRole( 'button', { name: /^retry$/i } ) );

			expect( onRetry ).toHaveBeenCalled();
		} );
	} );

	describe( 'generic error', () => {
		it( 'should render with a get help link', () => {
			const expectedHelpURL = registry
				.select( CORE_SITE )
				.getDocumentationLinkURL( 'analytics-additional-support' );

			const onRetry = jest.fn();
			const { getByRole, getByText } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="backend_error"
					onRetry={ onRetry }
				/>,
				{ registry }
			);

			expect(
				getByText( 'Analytics account creation failed' )
			).toBeInTheDocument();

			expect(
				getByText( 'Something went wrong. Try again or' )
			).toBeInTheDocument();

			const getHelpLink = getByRole( 'link', { name: /get help/i } );
			expect( getHelpLink ).toHaveAttribute( 'href', expectedHelpURL );

			expect(
				getByRole( 'button', { name: /^retry$/i } )
			).toBeInTheDocument();
		} );

		it( 'should call onRetry when the Retry button is clicked', () => {
			const onRetry = jest.fn();

			const { getByRole } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="backend_error"
					onRetry={ onRetry }
				/>,
				{ registry }
			);

			fireEvent.click( getByRole( 'button', { name: /^retry$/i } ) );

			expect( onRetry ).toHaveBeenCalled();
		} );
	} );
} );
