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
	PROPERTY_CREATE,
	SITE_GOALS_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
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
		// By default the selected property has no Site Goals custom
		// dimensions. Tests that need them set the property's list themselves.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetCustomDimensions( [], { propertyID } );
		// The row stays in its loading state while the property summaries
		// load, so set them as loaded.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( {
			accountSummaries: [],
			nextPageToken: null,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getAccountSummaries', [] );
	} );

	it( 'shows a progress bar while the setting is loading', async () => {
		// Keep the settings request pending so the row stays in its loading
		// state instead of erroring on an unmatched fetch.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/advanced-data-breakdowns-settings'
			)
		);

		const { container, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row--loading'
			)
		).toBeInTheDocument();

		// Wait for the pending settings request to settle inside `act()`, so
		// its state update does not bleed into the next test.
		await waitForRegistry();
	} );

	it( "shows a progress bar while the selected property's custom dimensions are loading", async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );
		// Select a property whose custom dimensions are not in the store, and
		// keep the request for them pending so the row stays loading.
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '654321' );
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/custom-dimensions'
			)
		);

		const { container, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row--loading'
			)
		).toBeInTheDocument();

		await waitForRegistry();
	} );

	it( 'shows a progress bar while no property is selected', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );
		// Changing the account clears the property selection until a new
		// property is matched.
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '' );

		const { container } = render( <SettingsAdvancedDataBreakdowns />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row--loading'
			)
		).toBeInTheDocument();
	} );

	it( 'shows the Enable button when the selected property has no Site Goals custom dimensions', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );

		const { getByRole, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByRole( 'button', { name: /enable/i } )
		).toBeInTheDocument();
	} );

	it( 'disables the Enable button when the user has no module access', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );

		const { getByRole, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns hasModuleAccess={ false } />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByRole( 'button', { name: /enable/i } ) ).toBeDisabled();
	} );

	it( 'shows the green check and hides the Enable button when the selected property has every Site Goals custom dimension', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetCustomDimensions( SITE_GOALS_CUSTOM_DIMENSIONS, {
				propertyID,
			} );

		const { container, queryByRole, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row__icon--check'
			)
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: /enable/i } )
		).not.toBeInTheDocument();
	} );

	it( 'updates the row when the selected property changes', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );
		// Another property already has every Site Goals custom dimension.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetCustomDimensions( SITE_GOALS_CUSTOM_DIMENSIONS, {
				propertyID: '654321',
			} );

		const { container, getByRole, queryByRole, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		await waitForRegistry();

		// The selected property has no Site Goals custom dimensions, so the
		// row shows the Enable button.
		expect(
			getByRole( 'button', { name: /enable/i } )
		).toBeInTheDocument();

		// Selecting the property that has every dimension shows the green
		// check without saving.
		act( () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '654321' );
		} );

		await waitFor( () => {
			expect(
				container.querySelector(
					'.googlesitekit-settings-measurement-row__icon--check'
				)
			).toBeInTheDocument();
		} );
		expect(
			queryByRole( 'button', { name: /enable/i } )
		).not.toBeInTheDocument();

		// Selecting the first property again shows the Enable button.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setPropertyID( propertyID );
		} );

		await waitFor( () => {
			expect(
				getByRole( 'button', { name: /enable/i } )
			).toBeInTheDocument();
		} );
	} );

	it( 'shows a disabled Enable button and no green check while a new property is being set up', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyID( PROPERTY_CREATE );

		const { container, getByRole, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row__icon--check'
			)
		).not.toBeInTheDocument();
		expect( getByRole( 'button', { name: /enable/i } ) ).toBeDisabled();
	} );

	it( 'triggers the OAuth scope prompt when the edit scope is missing', async () => {
		provideUserAuthentication( registry, { grantedScopes: [] } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAdvancedDataBreakdownsSettings( {} );

		const { getByRole, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		await waitForRegistry();

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
			.receiveGetAdvancedDataBreakdownsSettings( {} );

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

		const { getByRole, waitForRegistry } = render(
			<SettingsAdvancedDataBreakdowns />,
			{ registry }
		);

		await waitForRegistry();

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

		// Clicking Enable saves the selected property's flag, even though the
		// save then fails.
		const saveCalls = fetchMock
			.calls(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/save-advanced-data-breakdowns-settings'
				)
			)
			.map( ( [ , request ] ) => JSON.parse( request?.body as string ) );

		expect( saveCalls ).toEqual( [
			{ data: { settings: { [ propertyID ]: true } } },
		] );

		// The dimensions aren't created when the save fails.
		expect( fetchMock ).not.toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
			)
		);

		// The failed save logs the API error, which is expected here.
		expect( console ).toHaveErrored();
	} );
} );
