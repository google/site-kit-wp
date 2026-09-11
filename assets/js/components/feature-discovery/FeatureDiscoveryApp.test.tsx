/**
 * Feature Discovery App component tests.
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
 * External dependencies
 */
import { HashRouter } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeatureDiscoveryApp from './FeatureDiscoveryApp';

function provideHeader( registry: ReturnType< typeof createTestRegistry > ) {
	provideModules( registry );
	provideUserAuthentication( registry );

	registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
	registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
}

describe( 'FeatureDiscoveryApp', () => {
	afterEach( () => {
		global.history.replaceState( {}, '', '/' );
	} );

	async function renderApp( pathname = '/whats-new' ) {
		const registry = createTestRegistry();

		global.history.replaceState( {}, '', `/#${ pathname }` );

		provideHeader( registry );

		const result = render(
			<HashRouter>
				<FeatureDiscoveryApp />
			</HashRouter>,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await result.waitForRegistry();

		return result;
	}

	it( 'should render the shell including header', async () => {
		const { container } = await renderApp();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should activate the correct tab for /all-services', async () => {
		const { getByRole } = await renderApp( '/all-services' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'All services and features'
		);
	} );

	it( 'should activate the correct tab for /whats-new', async () => {
		const { getByRole } = await renderApp( '/whats-new' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'What’s new?'
		);
	} );

	it( 'should update the hash and active tab when selecting each tab', async () => {
		const { getByRole } = await renderApp();

		fireEvent.click(
			getByRole( 'tab', { name: 'All services and features' } )
		);

		expect( global.location.hash ).toBe( '#/all-services' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'All services and features'
		);

		fireEvent.click( getByRole( 'tab', { name: 'What’s new?' } ) );

		expect( global.location.hash ).toBe( '#/whats-new' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'What’s new?'
		);
	} );

	it( 'should push tab changes to history and restore the active tab on back and forward', async () => {
		const { getByRole } = await renderApp( '/all-services' );

		const historyLength = global.history.length;

		fireEvent.click( getByRole( 'tab', { name: 'What’s new?' } ) );

		expect( global.history.length ).toBe( historyLength + 1 );

		act( () => global.history.back() );

		await waitFor( () => {
			expect( global.location.hash ).toBe( '#/all-services' );

			expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
				'All services and features'
			);
		} );

		act( () => global.history.forward() );

		await waitFor( () => {
			expect( global.location.hash ).toBe( '#/whats-new' );

			expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
				'What’s new?'
			);
		} );
	} );

	it( 'should avoid adding history entries when clicking the current tab', async () => {
		const { getByRole } = await renderApp();

		const historyLength = global.history.length;

		fireEvent.click( getByRole( 'tab', { name: 'What’s new?' } ) );

		expect( global.history.length ).toBe( historyLength );
		expect( global.location.hash ).toBe( '#/whats-new' );
	} );
} );
