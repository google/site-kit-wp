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
import { render, createTestRegistry } from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

describe( 'SettingsModules', () => {
	// Create hash history to interact with HashRouter using `history.push`
	const history = createHashHistory();
	let savedLocationHash;

	beforeAll( () => {
		savedLocationHash = global.location.hash;
	} );

	beforeEach( () => {
		global.location.hash = '';
	} );

	afterAll( () => {
		// restore previous location hash after tests are complete
		global.location.hash = savedLocationHash;
	} );

	it( 'should redirect from #connect to #/connect-more-services', async () => {
		history.push( '/connect' );

		render( <SettingsModules />, { history } );

		expect( global.location.hash ).toEqual( '#/connect-more-services' );
	} );

	it( 'should redirect from #admin to #/admin-settings', async () => {
		const registry = createTestRegistry();
		const coreUserTrackingSettingsEndpointRegExp = /^\/google-site-kit\/v1\/core\/user\/data\/tracking/;
		const coreUserTrackingResponse = { status: 200, body: { enabled: false } };
		fetchMock.getOnce( coreUserTrackingSettingsEndpointRegExp, coreUserTrackingResponse );
		fetchMock.postOnce( coreUserTrackingSettingsEndpointRegExp, coreUserTrackingResponse );

		await registry.dispatch( CORE_USER ).setTrackingEnabled( false );

		history.push( '/admin' );

		render( <SettingsModules />, { history, registry } );

		expect( global.location.hash ).toEqual( '#/admin-settings' );
	} );

	it( 'should redirect from #settings to #/connected-services', async () => {
		history.push( '/settings' );

		render( <SettingsModules />, { history } );

		expect( global.location.hash ).toEqual( '#/connected-services' );
	} );

	it( 'should redirect from #settings/analytics/view to #/connected-services/analytics', async () => {
		history.push( '/settings/analytics/view' );

		render( <SettingsModules />, { history } );

		expect( global.location.hash ).toEqual( '#/connected-services/analytics' );
	} );

	it( 'should redirect from #settings/adsense/edit to #/connected-services/adsense/edit', async () => {
		history.push( '/settings/adsense/edit' );

		render( <SettingsModules />, { history } );

		expect( global.location.hash ).toEqual( '#/connected-services/adsense/edit' );
	} );

	it( 'should redirect from unknown location (fallback) to #/connected-services', async () => {
		history.push( '/UNKNOWN_LOCATION' );

		render( <SettingsModules />, { history } );

		expect( global.location.hash ).toEqual( '#/connected-services' );
	} );
} );
