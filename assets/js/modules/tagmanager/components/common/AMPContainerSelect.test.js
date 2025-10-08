/**
 * AMP Container Select component tests.
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
import AMPContainerSelect from './AMPContainerSelect';
import {
	fireEvent,
	render,
	act,
	waitForDefaultTimeouts,
} from '../../../../../../tests/js/test-utils';
import {
	MODULES_TAGMANAGER,
	CONTEXT_WEB,
	CONTEXT_AMP,
	CONTAINER_CREATE,
} from '@/js/modules/tagmanager/datastore/constants';
import { AMP_MODE_PRIMARY } from '@/js/googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideSiteInfo,
	untilResolved,
} from '../../../../../../tests/js/utils';
import * as factories from '@/js/modules/tagmanager/datastore/__factories__';

describe( 'AMPContainerSelect', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		// Set set no existing tag.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
		// Set site info to prevent error in resolver.
		provideSiteInfo( registry, { ampMode: AMP_MODE_PRIMARY } );
	} );

	it( 'should render an option for each AMP container of the currently selected account.', () => {
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

		const { getAllByRole } = render( <AMPContainerSelect />, { registry } );

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
			container: { usageContext: [ CONTEXT_AMP ] },
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

		const { getAllByRole } = render( <AMPContainerSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems.pop() ).toHaveTextContent(
			/set up a new container/i
		);
	} );

	it( 'can select the "Set up a new container" option', () => {
		const { account, containers } = factories.buildAccountWithContainers( {
			container: { usageContext: [ CONTEXT_AMP ] },
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

		const { container, getByText } = render( <AMPContainerSelect />, {
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
			container: { usageContext: [ CONTEXT_AMP ] },
		} );
		const ampContainer = containers[ 0 ];
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

		const { container, getByText, waitForRegistry } = render(
			<AMPContainerSelect />,
			{
				registry,
			}
		);

		expect(
			registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
		).toBeFalsy();
		expect(
			registry.select( MODULES_TAGMANAGER ).getInternalAMPContainerID()
		).toBeFalsy();

		fireEvent.click(
			container.querySelector( '.mdc-select__selected-text' )
		);

		await act( async () => {
			fireEvent.click(
				getByText( new RegExp( ampContainer.name, 'i' ) )
			);
			await untilResolved( registry, MODULES_TAGMANAGER ).getContainers(
				accountID
			);
		} );

		expect(
			registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
		).toBe( ampContainer.publicId ); // eslint-disable-line sitekit/acronym-case
		expect(
			registry.select( MODULES_TAGMANAGER ).getInternalAMPContainerID()
		).toBe( ampContainer.containerId ); // eslint-disable-line sitekit/acronym-case

		// Ensure any pending async updates from the enhanced Select finish before unmount,
		// preventing setState on unmounted component warnings in Jest.
		await waitForRegistry();
		await waitForDefaultTimeouts();
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

		const { queryByRole } = render( <AMPContainerSelect />, { registry } );

		expect(
			queryByRole( 'menu', { hidden: true } )
		).not.toBeInTheDocument();
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

		const { queryByRole } = render( <AMPContainerSelect />, { registry } );

		expect(
			queryByRole( 'menu', { hidden: true } )
		).not.toBeInTheDocument();
		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render nothing in a non-AMP context', () => {
		const account = factories.accountBuilder();
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		provideSiteInfo( registry, { ampMode: false } );

		const { queryByRole, container } = render( <AMPContainerSelect />, {
			registry,
		} );

		expect( queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect(
			queryByRole( 'menu', { hidden: true } )
		).not.toBeInTheDocument();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should disable the AMP container select if the user does not have module access', () => {
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
			<AMPContainerSelect hasModuleAccess={ false } />,
			{
				registry,
			}
		);

		// Verify that the AMP container select dropdown is disabled.
		[
			'.googlesitekit-tagmanager__select-container--amp',
			'.mdc-select--disabled',
		].forEach( ( className ) => {
			expect( container.querySelector( className ) ).toBeInTheDocument();
		} );
	} );
} );
