/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { render } from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
	MODULES_ANALYTICS,
} from '../../datastore/constants';
import SetupForm from './SetupForm';

const accountUA = {
	created: '2011-03-25T21:41:26.980Z',
	id: '123456789',
	kind: 'analytics#account',
	name: 'Test Account',
	selfLink:
		'https://www.googleapis.com/analytics/v3/management/accounts/123456789',
	starred: null,
	updated: '2019-08-22T17:20:53.203Z',
	permissions: {
		effective: [],
	},
	childLink: {
		href: 'https://www.googleapis.com/analytics/v3/management/accounts/123456789/webproperties',
		type: 'analytics#webproperties',
	},
};

const accountGA4 = {
	account: 'accounts/123456789',
	displayName: 'Example Org',
	name: 'accountSummaries/123456789',
	_id: '123456789',
	propertySummaries: [],
};

describe( 'SetupForm', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [ { slug: 'analytics', active: true } ] );
	} );

	it( 'renders the form', () => {
		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetAccounts( [ accountUA ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAccountSummaries( [ accountGA4 ] );

		const { getByRole } = render( <SetupForm />, { registry } );

		getByRole( 'button', { name: /Configure Analytics/i } );
	} );

	it( 'auto-submits the form once', async () => {
		const createPropertyRegexp = new RegExp(
			'/analytics/data/create-property'
		);
		fetchMock.post( createPropertyRegexp, {
			status: 403,
			body: {
				code: 403,
				error: 'Insufficient permissions',
			},
		} );
		const dispatchUA = registry.dispatch( MODULES_ANALYTICS );
		const dispatchGA4 = registry.dispatch( MODULES_ANALYTICS_4 );
		dispatchUA.setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		dispatchUA.receiveGetAccounts( [ accountUA ] );
		dispatchUA.receiveGetProperties( [], { accountID: accountUA.id } );
		dispatchUA.receiveGetExistingTag( null );

		dispatchGA4.receiveGetExistingTag( null );
		dispatchGA4.receiveGetAccountSummaries( [ accountGA4 ] );
		dispatchGA4.receiveGetProperties( [], { accountID: accountUA.id } );
		dispatchUA.selectAccount( accountUA.id );

		// Simulate an auto-submit case where the user is returning to the page
		// after granting extra scopes necessary to submit.
		// In this situation, the autoSubmit is set before the user goes to oAuth
		// store state is snapshotted, and then restored upon returning.
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { autoSubmit: true } );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const finishSetup = jest.fn();
		const { getByRole, waitForRegistry } = render(
			<SetupForm finishSetup={ finishSetup } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		// Ensure the form rendered successfully.
		getByRole( 'button', { name: /Configure Analytics/i } );

		// Create property should have only been called once.
		expect( fetchMock ).toHaveFetchedTimes( 1, createPropertyRegexp );
		// Setup was not successful, so the finish function should not be called.
		expect( finishSetup ).not.toHaveBeenCalled();
		// Expect a console error due to the API error (otherwise this test will fail).
		expect( console ).toHaveErrored();
	} );
} );
