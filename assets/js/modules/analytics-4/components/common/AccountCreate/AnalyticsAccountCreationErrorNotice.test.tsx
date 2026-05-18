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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
} from 'tests/js/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import AnalyticsAccountCreationErrorNotice from './AnalyticsAccountCreationErrorNotice';
import * as tracking from '@/js/util/tracking';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AnalyticsAccountCreationErrorNotice', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		mockTrackEvent.mockClear();
		global.history.replaceState(
			null,
			'',
			'/wp-admin/admin.php?page=googlesitekit-dashboard'
		);
	} );

	describe( 'user_cancel', () => {
		it( 'should render the terms of service not accepted variant', () => {
			const { getByRole, getByText } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="user_cancel"
					onRetry={ () => {} }
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

			const { getByRole, getByText } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="max_accounts_reached"
					onRetry={ () => {} }
				/>,
				{ registry }
			);

			expect(
				getByText( 'Analytics account creation failed' )
			).toBeInTheDocument();

			expect(
				getByText(
					'Creating a new Analytics account failed because the Analytics account limit has been reached. You can manage the number of Analytics accounts associated with your Google account and then try again, or'
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

			const { getByRole, getByText } = render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="backend_error"
					onRetry={ () => {} }
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

	describe( 'tracking', () => {
		it( 'tracks analytics_account_creation_error in initial setup flow when showProgress is present', () => {
			global.history.replaceState(
				null,
				'',
				'/wp-admin/admin.php?page=googlesitekit-dashboard&showProgress=true'
			);

			render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="backend_error"
					onRetry={ () => {} }
				/>,
				{ registry, viewContext: 'test-context' }
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'test-context_setup',
				'analytics_account_creation_error',
				'backend_error'
			);
		} );

		it( 'tracks analytics_account_creation_error in module setup flow when showProgress is not present', () => {
			global.history.replaceState(
				null,
				'',
				'/wp-admin/admin.php?page=googlesitekit-dashboard'
			);

			render(
				<AnalyticsAccountCreationErrorNotice
					errorCode="backend_error"
					onRetry={ () => {} }
				/>,
				{ registry, viewContext: 'test-context' }
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'test-context',
				'analytics_account_creation_error',
				'backend_error'
			);
		} );
	} );
} );
