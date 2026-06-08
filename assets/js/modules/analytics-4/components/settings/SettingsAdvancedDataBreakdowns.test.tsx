/**
 * SettingsAdvancedDataBreakdowns tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
	SITE_GOALS_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import SettingsAdvancedDataBreakdowns from './SettingsAdvancedDataBreakdowns';

describe( 'SettingsAdvancedDataBreakdowns', () => {
	let registry: WPDataRegistry;
	const propertyID = '123456';

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		provideSiteInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );
	} );

	it( 'shows a progress bar while the setting is loading', () => {
		// Keep the settings request pending so the row stays in its loading
		// state instead of erroring on an unmatched fetch.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/advanced-data-breakdowns-settings'
			)
		);

		const { container } = render( <SettingsAdvancedDataBreakdowns />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row--loading'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the Enable button when the setting is off', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( { enabled: false } );

		const { getByRole } = render( <SettingsAdvancedDataBreakdowns />, {
			registry,
		} );

		expect(
			getByRole( 'button', { name: /enable/i } )
		).toBeInTheDocument();
	} );

	it( 'disables the Enable button when the user has no module access', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( { enabled: false } );

		const { getByRole } = render(
			<SettingsAdvancedDataBreakdowns hasModuleAccess={ false } />,
			{ registry }
		);

		expect( getByRole( 'button', { name: /enable/i } ) ).toBeDisabled();
	} );

	it( 'shows the green check and hides the Enable button when all dimensions exist', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( { enabled: true } );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: SITE_GOALS_CUSTOM_DIMENSIONS,
		} );

		const { container, queryByRole } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row__icon--check'
			)
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: /enable/i } )
		).not.toBeInTheDocument();
	} );

	it( 'triggers the OAuth scope prompt when the edit scope is missing', async () => {
		provideUserAuthentication( registry, { grantedScopes: [] } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( { enabled: false } );

		const { getByRole } = render( <SettingsAdvancedDataBreakdowns />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /enable/i } ) );

		await waitFor( () => {
			const error = registry
				.select( CORE_USER )
				.getPermissionScopeError();
			expect( error?.data?.scopes ).toEqual( [ EDIT_SCOPE ] );
			expect( error?.data?.skipModal ).toBe( true );
		} );
	} );

	it( 'records the save error and skips creating dimensions when the save fails', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( { enabled: false } );

		const errorPayload = {
			code: 'internal_error',
			message: 'Save failed',
			data: { status: 500 },
		};

		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/save-advanced-data-breakdowns-settings'
			),
			{ body: errorPayload, status: 500 }
		);

		const { getByRole } = render( <SettingsAdvancedDataBreakdowns />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /enable/i } ) );

		// The failed save records its error in the store. The settings show it
		// at the top through StoreErrorNotices, so the row adds no inline notice.
		await waitFor( () => {
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForAction(
						'saveAdvancedDataBreakdownsSettings',
						[]
					)?.message
			).toBe( 'Save failed' );
		} );

		// The dimensions are not created when the save fails.
		expect( fetchMock ).not.toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
			)
		);

		// The failed save logs the API error, which is expected here.
		expect( console ).toHaveErrored();
	} );
} );
