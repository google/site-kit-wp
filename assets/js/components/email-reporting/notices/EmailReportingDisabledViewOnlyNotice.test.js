/**
 * EmailReportingDisabledViewOnlyNotice component tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { mockLocation } from '../../../../../tests/js/mock-browser-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '../../../../../tests/js/test-utils';
import EmailReportingDisabledViewOnlyNotice from './EmailReportingDisabledViewOnlyNotice';

describe( 'EmailReportingDisabledViewOnlyNotice', () => {
	mockLocation();
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );
	} );

	it( 'renders the notice when email reporting is disabled and user is view only', () => {
		const { getByText } = render(
			<EmailReportingDisabledViewOnlyNotice />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);

		// Title and description should be present.
		expect(
			getByText( /Email reports are unavailable/i )
		).toBeInTheDocument();
		expect(
			getByText( /To enable email reports, contact your administrator/i )
		).toBeInTheDocument();
	} );

	it( 'does not render the notice when email reporting is enabled', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		const { queryByText } = render(
			<EmailReportingDisabledViewOnlyNotice />,
			{
				registry,
			}
		);

		// Title should not be present.
		expect(
			queryByText( /Email reports are disabled/i )
		).not.toBeInTheDocument();
	} );
} );
