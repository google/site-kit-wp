/**
 * Account Select component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import AccountSelect from './AccountSelect';
import {
	fireEvent,
	freezeFetch,
	render,
	waitFor,
	act,
} from '../../../../../../tests/js/test-utils';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { provideSiteInfo } from '../../../../../../tests/js/utils';
import * as fixtures from '../../datastore/__fixtures__';
import * as uaFixtures from '../../../analytics/datastore/__fixtures__';
import {
	ACCOUNT_CREATE,
	MODULES_ANALYTICS,
} from '../../../analytics/datastore/constants';

const setupRegistry = ( registry ) => {
	provideSiteInfo( registry, {
		referenceSiteURL: 'http://googlekitlocal.10uplabs.com',
	} );

	registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetAccountSummaries( fixtures.accountSummaries );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getAccountSummaries', [] );
};

const setupLoadingRegistry = ( registry ) => {
	registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
};

const setupEmptyRegistry = ( registry ) => {
	registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( [] );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getAccountSummaries', [] );
};

describe( 'AccountSelect', () => {
	it( 'should render an option for each analytics account', () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new account".
		expect( listItems ).toHaveLength(
			fixtures.accountSummaries.length + 1
		);
	} );

	it( 'should have a "Set up a new account" item at the end of the list', () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems[ listItems.length - 1 ].textContent ).toMatch(
			/set up a new account/i
		);
	} );

	it( 'should render a loading state when accounts are undefined', async () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
			)
		);
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
			)
		);
		const { queryAllByRole, queryByRole } = render( <AccountSelect />, {
			setupRegistry: setupLoadingRegistry,
		} );

		await waitFor( () => {
			expect(
				queryAllByRole( 'menuitem', { hidden: true } )
			).toHaveLength( 0 );
		} );

		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render a select box with only setup when no accounts exist', () => {
		const { getAllByRole } = render( <AccountSelect />, {
			setupRegistry: setupEmptyRegistry,
		} );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ listItems.length - 1 ].textContent ).toMatch(
			/set up a new account/i
		);
	} );

	it( 'should update accountID in the store when a new item is clicked', () => {
		const { getByText, container, registry } = render( <AccountSelect />, {
			setupRegistry,
		} );
		const originalAccountID = registry
			.select( MODULES_ANALYTICS )
			.getAccountID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( /set up a new account/i ) );
		// Note: we use the new account option here to avoid querying properties profiles,
		// as these are pre-selected when this changed (see next test).

		const newAccountID = registry
			.select( MODULES_ANALYTICS )
			.getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( ACCOUNT_CREATE );
	} );

	it( 'should reset the property ID when the account is changed', () => {
		jest.useFakeTimers();

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
			{ body: [] }
		);
		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);

		const { getByText, container, registry } = render( <AccountSelect />, {
			setupRegistry,
		} );

		const accountID = fixtures.accountSummaries[ 1 ]._id;
		const properties = fixtures.accountSummaries[ 1 ].propertySummaries.map(
			( property ) => {
				return {
					...property,
					id: `UA-${ property._id }-1`,
					// eslint-disable-next-line sitekit/acronym-case
					accountId: accountID,
				};
			}
		);
		const propertyID = properties[ 0 ].id;
		const profiles = uaFixtures.profiles.map( ( profile ) => {
			return {
				...profile,
				accountId: accountID, // eslint-disable-line sitekit/acronym-case
				// eslint-disable-next-line sitekit/acronym-case
				webPropertyId: propertyID,
			};
		} );

		// We still need to mock the UA properties and profiles, as they're used in the `selectAccount` action.
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetProperties( properties, { accountID } );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
			accountID,
			propertyID,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( fixtures.webDataStreamsBatch, {
				propertyIDs: [ properties[ 0 ]._id ],
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getWebDataStreamsBatch', [
				properties[ 0 ]._id,
			] );

		act( () => {
			// Click the label to expose the elements in the menu.
			fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
			// Click this element to select it and fire the onChange event.
			const account = fixtures.accountSummaries.find(
				// eslint-disable-next-line sitekit/acronym-case
				( acct ) => acct._id === properties[ 0 ]._accountID
			);

			fireEvent.click( getByText( account.displayName ) );
		} );

		act( () => {
			jest.runAllTimers();
		} );

		const newGA4PropertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();

		expect( newGA4PropertyID ).toBe( PROPERTY_CREATE );
	} );
} );
