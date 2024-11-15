/**
 * Key Metrics ConversionReportingSettingsSubtleNotification component tests.
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

import {
	act,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import ConversionReportingSettingsSubtleNotification from './ConversionReportingSettingsSubtleNotification';
import { ACR_SUBTLE_NOTIFICATION_SLUG } from './constants';

describe( 'ConversionReportingSettingsSubtleNotification', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		provideSiteInfo( registry );
	} );

	it( 'should render "Get tailored metrics" CTA', async () => {
		const { queryByText, getByRole, waitForRegistry } = render(
			<ConversionReportingSettingsSubtleNotification />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( queryByText( /get tailored metrics/i ) ).toBeInTheDocument();
		const button = getByRole( 'button', { name: /get tailored metrics/i } );

		expect( button ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-user-input'
		);
	} );

	it( 'should render "Maybe later" CTA', () => {
		const { queryByText } = render(
			<ConversionReportingSettingsSubtleNotification />,
			{
				registry,
			}
		);

		expect( queryByText( /maybe later/i ) ).toBeInTheDocument();
	} );

	it( 'does not render when dismissed', async () => {
		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [ ACR_SUBTLE_NOTIFICATION_SLUG ] ),
				status: 200,
			}
		);

		const { getByRole } = render(
			<ConversionReportingSettingsSubtleNotification />,
			{
				registry,
			}
		);

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: 'Maybe later' } ) );
		} );
	} );
} );
