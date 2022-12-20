/**
 * GA4 useExistingTagEffect hook tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { MODULES_ANALYTICS } from '../datastore/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	CORE_SITE,
	AMP_MODE_SECONDARY,
} from '../../../googlesitekit/datastore/site/constants';
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import { createBuildAndReceivers } from '../../tagmanager/datastore/__factories__/utils';
import { withActive } from '../../../googlesitekit/modules/datastore/__fixtures__';
import useExistingTagEffect from './useExistingTagEffect';

describe( 'useExistingTagEffect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
		// Set no existing tag.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
	} );

	it( 'should not select an existing tag if it is available and should not disable the "use snippet" setting if the existing tag does not match the propertyID', () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
			),
			{ body: { properties: [] }, status: 200 }
		);
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/profiles'
			),
			{ body: [], status: 200 }
		);

		const existingTag = {
			accountID: '54321',
			propertyID: 'UA-987654321-1',
		};

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'tagmanager' ) );

		registry
			.dispatch( CORE_SITE )
			.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetExistingTag( existingTag.propertyID );

		const { buildAndReceiveWebAndAMP } =
			createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect(
			registry.select( MODULES_ANALYTICS ).getAccountID()
		).toBeUndefined();
		expect(
			registry.select( MODULES_ANALYTICS ).getPropertyID()
		).toBeUndefined();
		expect(
			registry.select( MODULES_ANALYTICS ).getUseSnippet()
		).toBeUndefined();
	} );

	it( 'should disable the "use snippet" setting if the existing tag matches the propertyID', async () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
			),
			{ body: { properties: [] }, status: 200 }
		);
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/profiles'
			),
			{ body: [], status: 200 }
		);

		const existingTag = {
			accountID: '54321',
			propertyID: 'UA-123456789-1',
		};

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'tagmanager' ) );

		registry
			.dispatch( CORE_SITE )
			.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetExistingTag( existingTag.propertyID );

		const { buildAndReceiveWebAndAMP } =
			createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		await untilResolved( registry, MODULES_ANALYTICS ).getSettings();

		act( () => {
			// Set the account and property ID the resolved state.
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( '' );
			registry.dispatch( MODULES_ANALYTICS ).setPropertyID( '' );

			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getAccountID() ).toBe(
			''
		);

		expect( registry.select( MODULES_ANALYTICS ).getPropertyID() ).toBe(
			''
		);

		expect(
			registry.select( MODULES_ANALYTICS ).getUseSnippet()
		).toBeUndefined();

		act( () => {
			// Set the account and property ID to match the existing tag.
			registry
				.dispatch( MODULES_ANALYTICS )
				.setAccountID( existingTag.accountID );
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( existingTag.propertyID );

			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			false
		);
	} );

	it( 'should enable the "use snippet" setting if the existing tag no longer matches the propertyID', async () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
			),
			{ body: { properties: [] }, status: 200 }
		);
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/profiles'
			),
			{ body: [], status: 200 }
		);

		const existingTag = {
			accountID: '54321',
			propertyID: 'UA-123456789-1',
		};

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'tagmanager' ) );

		registry
			.dispatch( CORE_SITE )
			.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetExistingTag( existingTag.propertyID );

		// Set the account and property ID to match the existing tag.
		registry
			.dispatch( MODULES_ANALYTICS )
			.setAccountID( existingTag.accountID );
		registry
			.dispatch( MODULES_ANALYTICS )
			.setPropertyID( existingTag.propertyID );

		const { buildAndReceiveWebAndAMP } =
			createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		await untilResolved( registry, MODULES_ANALYTICS ).getSettings();

		act( () => {
			// Set the account and property ID the resolved state.
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( '' );
			registry.dispatch( MODULES_ANALYTICS ).setPropertyID( '' );

			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getAccountID() ).toBe(
			''
		);

		expect( registry.select( MODULES_ANALYTICS ).getPropertyID() ).toBe(
			''
		);

		expect(
			registry.select( MODULES_ANALYTICS ).getUseSnippet()
		).toBeUndefined();

		act( () => {
			// Set the account and property ID to match the existing tag.
			registry
				.dispatch( MODULES_ANALYTICS )
				.setAccountID( existingTag.accountID );
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( existingTag.propertyID );

			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			false
		);

		// Set the property ID to no longer match the existing tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( 'UA-555555555-1' );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			true
		);
	} );

	it( 'does not change the useSnippet value when there is already a property ID on page load (property ID is same as existing tag)', async () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
			),
			{ body: { properties: [] }, status: 200 }
		);
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/profiles'
			),
			{ body: [], status: 200 }
		);

		const existingTag = {
			accountID: '54321',
			propertyID: 'UA-123456789-1',
		};

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'tagmanager' ) );

		registry
			.dispatch( CORE_SITE )
			.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetExistingTag( existingTag.propertyID );

		const { buildAndReceiveWebAndAMP } =
			createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		await untilResolved( registry, MODULES_ANALYTICS ).getSettings();

		act( () => {
			// Set the account and property ID to match the existing tag.
			registry
				.dispatch( MODULES_ANALYTICS )
				.setAccountID( existingTag.accountID );
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( existingTag.propertyID );

			// Manually set the useSnippet value to true.
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
			rerender();
		} );
		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			true
		);

		// Set the property ID to no longer match the existing tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( 'UA-555555555-1' );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			true
		);

		// Set the property ID to match the existing tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( existingTag.propertyID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			false
		);
	} );

	it( 'does not change the useSnippet value when there is already a property ID on page load (property ID is not the same as existing tag)', async () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
			),
			{ body: { properties: [] }, status: 200 }
		);
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/profiles'
			),
			{ body: [], status: 200 }
		);

		const existingTag = {
			accountID: '54321',
			propertyID: 'UA-123456789-1',
		};

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		const secondTag = {
			accountID: '65432',
			propertyID: 'UA-555555555-1',
		};

		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'tagmanager' ) );

		registry
			.dispatch( CORE_SITE )
			.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetExistingTag( existingTag.propertyID );

		const { buildAndReceiveWebAndAMP } =
			createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		await untilResolved( registry, MODULES_ANALYTICS ).getSettings();

		act( () => {
			// Set the account and property ID as a different one.
			registry
				.dispatch( MODULES_ANALYTICS )
				.setAccountID( secondTag.accountID );
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( secondTag.propertyID );

			// Manually set the useSnippet value to false.
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( false );
			rerender();
		} );
		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			false
		);

		// Set the property ID to another one.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( 'UA-777777777-1' );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			true
		);

		// Set the property ID to match the existing tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( existingTag.propertyID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			false
		);

		// Set the property ID to the initially selected tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( secondTag.propertyID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS ).getUseSnippet() ).toBe(
			true
		);
	} );
} );
