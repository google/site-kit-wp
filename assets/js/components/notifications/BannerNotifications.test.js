/**
 * `BannerNotifications` tests.
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
	createTestRegistry,
	muteFetch,
	provideModules,
	provideSiteConnection,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
	render,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import useQueryArg from '../../hooks/useQueryArg';
import BannerNotifications from './BannerNotifications';

jest.mock( '../../hooks/useQueryArg' );

// Set up mockImplementation for `useQueryArg` used in this component,
// so we can set expected the query params
function stubMockUseQueryArg( notification = '' ) {
	useQueryArg.mockImplementation( ( queryArg ) => {
		if ( 'notification' === queryArg && notification ) {
			return [ notification ];
		}
		return [ undefined ];
	} );
}

describe( 'BannerNotifications', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			[]
		);

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [] );
		registry.dispatch( CORE_USER ).receiveNonces( [] );
	} );

	it( 'render `authentication_success` notification if `authentication_success` query param value is passed', async () => {
		stubMockUseQueryArg( 'authentication_success' );

		const { queryByText, waitForRegistry } = render(
			<BannerNotifications />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			queryByText( /congrats on completing the setup for/i )
		).toBeInTheDocument();
	} );

	it( 'does not render `setup complete` notification if `custom_dimensions` query arg value is passed', async () => {
		// Add arbitrary value for `notification` to prevent server appending `authentication_success`
		// on the redirect, so setup completed notification does not show
		stubMockUseQueryArg( 'custom_dimensions' );

		const { queryByText, waitForRegistry } = render(
			<BannerNotifications />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			queryByText( /congrats on completing the setup for/i )
		).not.toBeInTheDocument();
	} );
} );
