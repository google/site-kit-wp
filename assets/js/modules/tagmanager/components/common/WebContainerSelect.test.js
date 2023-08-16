/**
 * Web Container Select component tests.
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
import WebContainerSelect from './WebContainerSelect';
import { fireEvent, render, act } from '../../../../../../tests/js/test-utils';
import {
	MODULES_TAGMANAGER,
	CONTEXT_WEB,
	CONTEXT_AMP,
	CONTAINER_CREATE,
} from '../../datastore/constants';
import {
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideSiteInfo,
	untilResolved,
} from '../../../../../../tests/js/utils';
import * as factories from '../../datastore/__factories__';

describe( 'WebContainerSelect', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		// Set set no existing tag.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
		// Set site info to prevent error in resolver.
		provideSiteInfo( registry );
	} );

	it( 'should render an option for each web container of the currently selected account.', () => {
		const account = factories.accountBuilder();
		const webContainers = factories.buildContainers(
			3,
			{ accountId: account.accountId, usageContext: [ CONTEXT_WEB ] } // eslint-disable-line sitekit/acronym-case
		);
		const ampContainers = factories.buildContainers(
			3,
			{ accountId: account.accountId, usageContext: [ CONTEXT_AMP ] } // eslint-disable-line sitekit/acronym-case
		);
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( [ ...webContainers, ...ampContainers ], {
				accountID,
			} );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getContainers', [ accountID ] );

		const { getAllByRole } = render( <WebContainerSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new container".
		expect( listItems ).toHaveLength( webContainers.length + 1 );
		expect(
			listItems.some(
				( { dataset } ) => dataset.value === CONTAINER_CREATE
			)
		).toBe( true );
	} );

	it( 'should have a "Set up a new container" item at the end of the list', () => {
		const { account, containers } = factories.buildAccountWithContainers( {
			container: { usageContext: [ CONTEXT_WEB ] },
		} );
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getContainers', [ accountID ] );

		const { getAllByRole } = render( <WebContainerSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems.pop() ).toHaveTextContent(
			/set up a new container/i
		);
	} );

	it( 'can select the "Set up a new container" option', () => {
		const { account, containers } = factories.buildAccountWithContainers( {
			container: { usageContext: [ CONTEXT_WEB ] },
		} );
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getContainers', [ accountID ] );

		const { container, getByText } = render( <WebContainerSelect />, {
			registry,
		} );

		fireEvent.click(
			container.querySelector( '.mdc-select__selected-text' )
		);
		fireEvent.click( getByText( /set up a new container/i ) );

		expect(
			container.querySelector( '.mdc-select__selected-text' )
		).toHaveTextContent( /set up a new container/i );
	} );

	it( 'should update the container ID and internal container ID when selected', async () => {
		const { account, containers } = factories.buildAccountWithContainers( {
			container: { usageContext: [ CONTEXT_WEB ] },
		} );
		const webContainer = containers[ 0 ];
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getContainers', [ accountID ] );

		const { container, getByText } = render( <WebContainerSelect />, {
			registry,
		} );

		expect(
			registry.select( MODULES_TAGMANAGER ).getContainerID()
		).toBeFalsy();
		expect(
			registry.select( MODULES_TAGMANAGER ).getInternalContainerID()
		).toBeFalsy();

		fireEvent.click(
			container.querySelector( '.mdc-select__selected-text' )
		);

		await act( async () => {
			fireEvent.click(
				getByText( new RegExp( webContainer.name, 'i' ) )
			);
			await untilResolved( registry, MODULES_TAGMANAGER ).getContainers(
				accountID
			);
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getContainerID() ).toBe(
			// eslint-disable-next-line sitekit/acronym-case
			webContainer.publicId
		);
		expect(
			registry.select( MODULES_TAGMANAGER ).getInternalContainerID()
			// eslint-disable-next-line sitekit/acronym-case
		).toBe( webContainer.containerId );
	} );

	it( 'should render a loading state while accounts have not been loaded', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/accounts'
			)
		);
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/containers'
			)
		);
		const account = factories.accountBuilder();
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );

		const { queryAllByRole, queryByRole } = render(
			<WebContainerSelect />,
			{ registry }
		);

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength(
			0
		);

		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render a loading state while containers are loading', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/containers'
			)
		);
		const account = factories.accountBuilder();
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );

		const { queryAllByRole, queryByRole } = render(
			<WebContainerSelect />,
			{ registry }
		);

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength(
			0
		);

		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should be labeled as "Container" in a no AMP context', () => {
		const { account, containers } = factories.buildAccountWithContainers();
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getContainers', [ accountID ] );

		const { container } = render( <WebContainerSelect />, { registry } );

		expect(
			container.querySelector( '.mdc-floating-label' )
		).toHaveTextContent( /Container/i );
	} );

	it.each( [ AMP_MODE_PRIMARY, AMP_MODE_SECONDARY ] )(
		'should be labeled as "Web Container" in a %s AMP context',
		( mode ) => {
			const { account, containers } =
				factories.buildAccountWithContainers();
			const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
			registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( [ account ] );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.finishResolution( 'getAccounts', [] );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( containers, { accountID } );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.finishResolution( 'getContainers', [ accountID ] );
			provideSiteInfo( registry, { ampMode: mode } );

			const { container } = render( <WebContainerSelect />, {
				registry,
			} );

			expect(
				container.querySelector( '.mdc-floating-label' )
			).toHaveTextContent( /Web Container/i );
		}
	);

	it( 'should disable the web container select if the user does not have module access', () => {
		const { account } = factories.buildAccountWithContainers();
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );

		const { container } = render(
			<WebContainerSelect hasModuleAccess={ false } />,
			{
				registry,
			}
		);

		// Verify that the Web container select dropdown is disabled.
		[
			'.googlesitekit-tagmanager__select-container--web',
			'.mdc-select--disabled',
		].forEach( ( className ) => {
			expect( container.querySelector( className ) ).toBeInTheDocument();
		} );
	} );
} );
