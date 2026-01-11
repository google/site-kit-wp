/**
 * EmailReportingDisabledNotice component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	render,
	provideModules,
	provideUserCapabilities,
	provideUserAuthentication,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { mockLocation } from '../../../../../tests/js/mock-browser-utils';
import EmailReportingDisabledNotice from './EmailReportingDisabledNotice';

describe( 'EmailReportingDisabledNotice', () => {
	mockLocation();
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );
	} );

	it( 'renders the notice when email reporting is disabled and user is not view only', () => {
		const { getByText } = render( <EmailReportingDisabledNotice />, {
			registry,
		} );

		// Title and description should be present.
		expect(
			getByText( /Email reports are disabled/i )
		).toBeInTheDocument();
		expect(
			getByText(
				/This feature was disabled for all users. You can enable email report subscriptions in settings/i
			)
		).toBeInTheDocument();
	} );

	it( 'does not render the notice when email reporting is enabled', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		const { queryByText } = render( <EmailReportingDisabledNotice />, {
			registry,
		} );

		// Title should not be present.
		expect(
			queryByText( /Email reports are disabled/i )
		).not.toBeInTheDocument();
	} );
} );
