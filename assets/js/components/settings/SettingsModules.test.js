/**
 * SettingsModules component tests.
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
 * External dependencies
 */
import { createHashHistory } from 'history';

/**
 * Internal dependencies
 */
import SettingsModules from './SettingsModules';
import {
	render,
	createTestRegistry,
	provideModules,
	muteFetch,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

describe( 'SettingsModules', () => {
	// Create hash history to interact with HashRouter using `history.push`
	const history = createHashHistory();
	let registry;
	let savedLocationHash;

	beforeAll( () => {
		savedLocationHash = global.location.hash;
	} );

	beforeEach( () => {
		global.location.hash = '';
		registry = createTestRegistry();
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( [
				{ slug: 'test-module', name: 'Test Module' },
			] );
		registry
			.dispatch( CORE_SITE )
			.receiveGetAdminBarSettings( { enabled: true } );
	} );

	afterAll( () => {
		// restore previous location hash after tests are complete
		global.location.hash = savedLocationHash;
	} );

	it( 'should redirect from #connect to #/connect-more-services', async () => {
		registry = createTestRegistry();

		provideModules( registry );
		history.push( '/connect' );

		const { waitForRegistry } = render( <SettingsModules />, {
			history,
			registry,
		} );

		await waitForRegistry();

		expect( global.location.hash ).toEqual( '#/connect-more-services' );
	} );

	it( 'should redirect from #admin to #/admin-settings', async () => {
		const coreUserTrackingSettingsEndpointRegExp = new RegExp(
			'^/google-site-kit/v1/core/user/data/tracking'
		);

		muteFetch(
			new RegExp( '^/google-site-kit/v1/modules/search-console/data' )
		);
		const coreUserTrackingResponse = {
			status: 200,
			body: { enabled: false },
		};
		fetchMock.getOnce(
			coreUserTrackingSettingsEndpointRegExp,
			coreUserTrackingResponse
		);
		fetchMock.postOnce(
			coreUserTrackingSettingsEndpointRegExp,
			coreUserTrackingResponse
		);

		await registry.dispatch( CORE_USER ).setTrackingEnabled( false );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );

		history.push( '/admin' );

		const { waitForRegistry } = render( <SettingsModules />, {
			history,
			registry,
		} );

		await waitForRegistry();

		expect( global.location.hash ).toEqual( '#/admin-settings' );
	} );

	it( 'should redirect from #settings to #/connected-services', () => {
		history.push( '/settings' );

		render( <SettingsModules />, { history, registry } );

		expect( global.location.hash ).toEqual( '#/connected-services' );
	} );

	it( 'should redirect from #settings/:moduleSlug/view to #/connected-services/:moduleSlug', () => {
		history.push( '/settings/analytics-4/view' );

		render( <SettingsModules />, { history, registry } );

		expect( global.location.hash ).toEqual(
			'#/connected-services/analytics-4'
		);
	} );

	it( 'should redirect from #settings/:moduleSlug/edit to #/connected-services/:moduleSlug/edit', () => {
		history.push( '/settings/adsense/edit' );

		render( <SettingsModules />, { history, registry } );

		expect( global.location.hash ).toEqual(
			'#/connected-services/adsense/edit'
		);
	} );

	it( 'should redirect from unknown location (fallback) to #/connected-services', () => {
		history.push( '/UNKNOWN_LOCATION' );

		render( <SettingsModules />, { history, registry } );

		expect( global.location.hash ).toEqual( '#/connected-services' );
	} );
} );
