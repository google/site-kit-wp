/**
 * Account Select component tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import WebContainerSelect from './WebContainerSelect';
import { fireEvent, render } from '../../../../../../tests/js/test-utils';
import { STORE_NAME, CONTEXT_WEB, CONTEXT_AMP, CONTAINER_CREATE } from '../../datastore/constants';
import * as factories from '../../datastore/__factories__';

describe( 'WebContainerSelect', () => {
	afterEach( () => fetchMock.mockReset() );

	it( 'should render an option for each web container of the currently selected account.', () => {
		const account = factories.accountBuilder();
		const webContainers = factories.buildContainers(
			3, { accountId: account.accountId, usageContext: [ CONTEXT_WEB ] }
		);
		const ampContainers = factories.buildContainers(
			3, { accountId: account.accountId, usageContext: [ CONTEXT_AMP ] }
		);
		const setupRegistry = ( registry ) => {
			const accountID = account.accountId;
			registry.dispatch( STORE_NAME ).setSettings( {} );
			registry.dispatch( STORE_NAME ).setAccountID( accountID );
			registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
			registry.dispatch( STORE_NAME ).receiveGetContainers( [ ...webContainers, ...ampContainers ], { accountID } );
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};

		const { getAllByRole } = render( <WebContainerSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new container".
		expect( listItems ).toHaveLength( webContainers.length + 1 );
		expect(
			listItems.some( ( { dataset } ) => dataset.value === CONTAINER_CREATE )
		).toBe( true );
	} );

	it( 'should have a "Set up a new container" item at the end of the list', () => {
		const setupRegistry = ( registry ) => {
			const { account, containers } = factories.buildAccountWithContainers(
				{ container: { usageContext: [ CONTEXT_WEB ] } }
			);
			const accountID = account.accountId;
			registry.dispatch( STORE_NAME ).setSettings( {} );
			registry.dispatch( STORE_NAME ).setAccountID( accountID );
			registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
			registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};

		const { getAllByRole } = render( <WebContainerSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems.pop() ).toHaveTextContent( /set up a new container/i );
	} );

	it( 'should update the container ID and internal container ID when selected', () => {
		const { account, containers } = factories.buildAccountWithContainers(
			{ container: { usageContext: [ CONTEXT_WEB ] } }
		);
		const webContainer = containers[ 0 ];
		const setupRegistry = ( registry ) => {
			const accountID = account.accountId;
			registry.dispatch( STORE_NAME ).setSettings( {} );
			registry.dispatch( STORE_NAME ).setAccountID( accountID );
			registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
			registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};

		const { container, getByText, registry } = render( <WebContainerSelect />, { setupRegistry } );
		expect( registry.select( STORE_NAME ).getContainerID() ).toBeFalsy();
		expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBeFalsy();

		fireEvent.click( container.querySelector( '.mdc-select__selected-text' ) );
		fireEvent.click( getByText( webContainer.name ) );

		expect( registry.select( STORE_NAME ).getContainerID() ).toBe( webContainer.publicId );
		expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( webContainer.containerId );
	} );

	it( 'should render a loading state while accounts have not been loaded', () => {
		const setupRegistry = ( registry ) => {
			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/,
				new Promise( () => {} ) // Return a promise that never resolves to simulate an endless request.
			);
			registry.dispatch( STORE_NAME ).setSettings( {} );
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};
		const { queryAllByRole, queryByRole } = render( <WebContainerSelect />, { setupRegistry } );

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength( 0 );

		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render a loading state while containers are loading', () => {
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
			new Promise( () => {} ) // Return a promise that never resolves to simulate an endless request.
		);
		const setupRegistry = ( registry ) => {
			const account = factories.accountBuilder();
			const accountID = account.accountId;
			registry.dispatch( STORE_NAME ).setSettings( {} );
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
			registry.dispatch( STORE_NAME ).setAccountID( accountID );
		};
		const { queryAllByRole, queryByRole } = render( <WebContainerSelect />, { setupRegistry } );

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength( 0 );

		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );
} );
