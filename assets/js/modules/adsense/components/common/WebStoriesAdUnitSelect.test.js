/**
 * AdSense Web Stories Ad Unit Select component tests.
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
import WebStoriesAdUnitSelect from './WebStoriesAdUnitSelect';
import {
	fireEvent,
	render,
	freezeFetch,
	createTestRegistry,
} from '../../../../../../tests/js/test-utils';
import { MODULES_ADSENSE } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';

const TEST_ACCOUNT_ID = '123';
const TEST_CLIENT_ID = '456';

describe( 'WebStoriesAdUnitSelect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			accountID: TEST_ACCOUNT_ID,
			clientID: TEST_CLIENT_ID,
		} );

		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetAdUnits( fixtures.adunits, {
				accountID: TEST_ACCOUNT_ID,
				clientID: TEST_CLIENT_ID,
			} );
		registry
			.dispatch( MODULES_ADSENSE )
			.finishResolution( 'getAdUnits', [
				TEST_ACCOUNT_ID,
				TEST_CLIENT_ID,
			] );
	} );

	it( 'should render an option for each AdSense ad unit', async () => {
		const { getAllByRole } = render( <WebStoriesAdUnitSelect />, {
			registry,
		} );

		const listItems = await getAllByRole( 'menuitem', { hidden: true } );

		expect( listItems ).toHaveLength( fixtures.adunits.length + 1 ); // + 1 accounts for the default value "Select ad unit".
	} );

	it( 'should render a loading state when ad units are undefined', () => {
		registry
			.dispatch( MODULES_ADSENSE )
			.startResolution( 'getAdUnits', [
				TEST_ACCOUNT_ID,
				TEST_CLIENT_ID,
			] );

		freezeFetch(
			new RegExp( '^/google-site-kit/v1/modules/adsense/data/adunits' )
		);

		const { queryAllByRole, queryByRole } = render(
			<WebStoriesAdUnitSelect />,
			{
				registry,
			}
		);

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength(
			0
		);
		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should update webStoriesAdUnit in the store when a new item is clicked', () => {
		const { getByText, container } = render( <WebStoriesAdUnitSelect />, {
			registry,
		} );
		const originalWebStoriesAdUnit = registry
			.select( MODULES_ADSENSE )
			.getWebStoriesAdUnit();
		const selectedAdUnit = fixtures.adunits[ 0 ];

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( selectedAdUnit.displayName ) );

		const newWebStoriesAdUnit = registry
			.select( MODULES_ADSENSE )
			.getWebStoriesAdUnit();
		expect( originalWebStoriesAdUnit ).not.toEqual( newWebStoriesAdUnit );
		expect( newWebStoriesAdUnit ).toEqual( selectedAdUnit._id );
	} );
} );
