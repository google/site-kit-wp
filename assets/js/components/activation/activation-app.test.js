/**
 * ActivationApp component tests.
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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { PERMISSION_VIEW_DASHBOARD } from '@/js/googlesitekit/datastore/user/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserCapabilities,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { ActivationApp } from './activation-app';

describe( 'ActivationApp', () => {
	mockLocation();

	function setupRegistry( { siteKitAutoUpdatesEnabled = false } = {} ) {
		const registry = createTestRegistry();

		provideSiteInfo( registry, {
			siteKitAutoUpdatesEnabled,
		} );

		provideUserCapabilities( registry, {
			[ PERMISSION_VIEW_DASHBOARD ]: false,
		} );

		return registry;
	}

	it( 'renders auto-updates checkbox when setupFlowRefreshPhase4 is enabled and auto-updates are disabled', () => {
		const registry = setupRegistry( { siteKitAutoUpdatesEnabled: false } );

		const { getByLabelText } = render( <ActivationApp />, {
			features: [ 'setupFlowRefreshPhase4' ],
			registry,
			viewContext: 'activation',
		} );

		const checkbox = getByLabelText(
			"Enable auto-update and stay up-to-date with Site Kit's latest features"
		);

		expect( checkbox ).toBeInTheDocument();
		expect( checkbox ).not.toBeChecked();
	} );

	it( 'does not render auto-updates checkbox when setupFlowRefreshPhase4 is disabled', () => {
		const registry = setupRegistry( { siteKitAutoUpdatesEnabled: false } );

		const { queryByLabelText } = render( <ActivationApp />, {
			registry,
			viewContext: 'activation',
		} );

		expect(
			queryByLabelText(
				"Enable auto-update and stay up-to-date with Site Kit's latest features"
			)
		).not.toBeInTheDocument();
	} );

	it( 'enables auto-updates checkbox when toggled', () => {
		const registry = setupRegistry( { siteKitAutoUpdatesEnabled: false } );

		const { getByLabelText } = render( <ActivationApp />, {
			features: [ 'setupFlowRefreshPhase4' ],
			registry,
			viewContext: 'activation',
		} );

		const checkbox = getByLabelText(
			"Enable auto-update and stay up-to-date with Site Kit's latest features"
		);

		fireEvent.click( checkbox );
		expect( checkbox ).toBeChecked();

		fireEvent.click( checkbox );
		expect( checkbox ).not.toBeChecked();
	} );

	it( 'enables auto-updates before navigation when checkbox is checked', async () => {
		const registry = setupRegistry( { siteKitAutoUpdatesEnabled: false } );
		const enableAutoUpdateSpy = jest
			.spyOn( registry.dispatch( CORE_SITE ), 'enableAutoUpdate' )
			.mockResolvedValue();

		const { getByLabelText, getByRole } = render( <ActivationApp />, {
			features: [ 'setupFlowRefreshPhase4' ],
			registry,
			viewContext: 'activation',
		} );

		fireEvent.click(
			getByLabelText(
				"Enable auto-update and stay up-to-date with Site Kit's latest features"
			)
		);
		fireEvent.click( getByRole( 'button', { name: 'Start setup' } ) );

		await waitFor( () => {
			expect( enableAutoUpdateSpy ).toHaveBeenCalledTimes( 1 );
			expect( global.location.assign ).toHaveBeenCalledWith(
				'http://example.com/wp-admin/admin.php?page=googlesitekit-splash'
			);
		} );
	} );
} );
