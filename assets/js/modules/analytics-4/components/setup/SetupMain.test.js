/**
 * SetupMain component tests.
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
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';
import {
	EDIT_SCOPE,
	GTM_SCOPE,
	MODULES_ANALYTICS_4,
	PROVISIONING_SCOPE,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import * as fixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import SetupMain from './SetupMain';

const { accountSummaries } = fixtures;

describe( 'SetupMain', () => {
	mockLocation();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE, PROVISIONING_SCOPE, GTM_SCOPE ],
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: true,
		} );
	} );

	describe( 'isCreateAccount', () => {
		it( 'should render the Create Account screen when an account creation error is present, even if the user has existing accounts', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&accountCreationErrorCode=user_cancel';

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetAccountSummaries( accountSummaries );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getAccountSummaries', [] );

			const { getByRole, waitForRegistry } = render( <SetupMain />, {
				registry,
				features: [ 'setupFlowRefresh' ],
			} );

			await waitForRegistry();

			expect(
				getByRole( 'button', { name: 'Create Account' } )
			).toBeInTheDocument();
		} );

		it( 'should not force the Create Account screen when the `setupFlowRefresh` feature flag is disabled', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&accountCreationErrorCode=user_cancel';

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetAccountSummaries( accountSummaries );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getAccountSummaries', [] );

			const { queryByRole, waitForRegistry } = render( <SetupMain />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				queryByRole( 'button', { name: 'Create Account' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
