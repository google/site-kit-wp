/**
 * SettingsActiveModule Header component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { Switch, Route } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { DOWN, ENTER, ESCAPE, UP } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Header from '.';
import {
	render,
	createTestRegistry,
	provideModules,
	fireEvent,
	provideUserInfo,
	provideModuleRegistrations,
} from '../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_TAGMANAGER } from '@/js/modules/tagmanager/constants';

describe( 'Header', () => {
	const history = createHashHistory();
	let registry;

	function HeaderAwareRouter() {
		return (
			<Switch>
				<Route
					path={ [
						'/connected-services/:moduleSlug',
						'/connected-services',
					] }
				>
					<Header slug="pagespeed-insights" />,
				</Route>
			</Switch>
		);
	}

	beforeEach( () => {
		global.location.hash = '';
		registry = createTestRegistry();

		provideUserInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_PAGESPEED_INSIGHTS,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_TAGMANAGER,
				active: true,
				// Intentionally not connected here with both settings components for tests below.
				connected: false,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				// Intentionally not connected here with both settings components for tests below.
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( CORE_USER ).receiveGetAuthentication( {} );
	} );

	it( 'should render "Connected" for a connected module', () => {
		const { container } = render( <Header slug="pagespeed-insights" />, {
			registry,
		} );

		expect( container ).toHaveTextContent( 'Connected' );
	} );

	it( 'should render a button to complete setup for a non-connected module', () => {
		const { queryByRole } = render( <Header slug="tagmanager" />, {
			registry,
		} );

		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Complete setup for Tag Manager' );
	} );

	it( 'should open the tab when ENTER key is pressed', () => {
		history.push( '/connected-services' );

		const { container } = render( <HeaderAwareRouter />, {
			registry,
			history,
		} );

		const headerElement = container.querySelector(
			'.googlesitekit-settings-module__header'
		);

		fireEvent.keyDown( headerElement, { keyCode: ENTER } );
		expect(
			headerElement.classList.contains(
				'googlesitekit-settings-module__header--open'
			)
		).toBe( true );
	} );

	it( 'should close the tab if opened when ENTER key is pressed', () => {
		history.push( '/connected-services/pagespeed-insights' );

		const { container } = render( <HeaderAwareRouter />, {
			registry,
			history,
		} );

		const headerElement = container.querySelector(
			'.googlesitekit-settings-module__header'
		);

		fireEvent.keyDown( headerElement, { keyCode: ENTER } );
		expect(
			headerElement.classList.contains(
				'googlesitekit-settings-module__header--open'
			)
		).toBe( false );
	} );

	it( 'should close the tab if opened when ESCAPE key is pressed', () => {
		history.push( '/connected-services/pagespeed-insights' );

		const { container } = render( <HeaderAwareRouter />, {
			registry,
			history,
		} );

		const headerElement = container.querySelector(
			'.googlesitekit-settings-module__header'
		);

		fireEvent.keyDown( headerElement, { keyCode: ESCAPE } );
		expect(
			headerElement.classList.contains(
				'googlesitekit-settings-module__header--open'
			)
		).toBe( false );
	} );

	it( 'should not toggle the tab if any other key is pressed', () => {
		// Ensure the tab is closed.
		history.push( '/connected-services' );

		const { container } = render( <HeaderAwareRouter />, {
			registry,
			history,
		} );

		const headerElement = container.querySelector(
			'.googlesitekit-settings-module__header'
		);

		fireEvent.keyDown( headerElement, { keyCode: DOWN } );
		// Ensure the tab is still closed after pressing the DOWN key.
		expect(
			headerElement.classList.contains(
				'googlesitekit-settings-module__header--open'
			)
		).toBe( false );

		// Ensure the tab is open.
		history.push( '/connected-services/pagespeed-insights' );

		fireEvent.keyDown( headerElement, { keyCode: UP } );
		// Ensure the tab is still open after pressing the UP key.
		expect(
			headerElement.classList.contains(
				'googlesitekit-settings-module__header--open'
			)
		).toBe( true );
	} );
} );
