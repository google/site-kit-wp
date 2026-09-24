/**
 * Reader Revenue Manager ExpressSetupDefault component tests.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AuthenticatedPermissionsModal from '@/js/components/PermissionsModal/AuthenticatedPermissionsModal';
import { Registry } from '@/js/googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import ExpressSetupDefault from './ExpressSetupDefault';

jest.mock( './PoweredBy', () => () => null );

const STEP_CONTENT = {
	[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]:
		'To use Reader Revenue Manager, you will need to create a publication.',
	[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]:
		'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.',
	[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]:
		'To use Reader Revenue Manager, you will need to add links to your publication’s policies.',
	[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: 'Reader Revenue Manager is set up',
};

describe( 'ExpressSetupDefault', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideUserAuthentication( registry, {
			grantedScopes: EXPRESS_SETUP_SCOPES,
		} );

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		providePublications( registry, [] );
	} );

	it( 'renders the default steps without a setup CTA step', () => {
		global.location.href = 'http://example.com/';

		const { getByText, queryByText, container } = render(
			<ExpressSetupDefault />,
			{ registry }
		);

		expect( getByText( 'Connect publication' ) ).toBeInTheDocument();
		expect( getByText( 'Add publication policies' ) ).toBeInTheDocument();
		expect( getByText( 'Setup complete' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Set up a sign-up form' )
		).not.toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 3 );
	} );

	it.each( Object.entries( STEP_CONTENT ) )(
		'renders the %s step content',
		async ( step, content ) => {
			global.location.href = `http://example.com/?step=${ step }`;

			const { getByText, queryByText } = render(
				<ExpressSetupDefault />,
				{ registry }
			);

			await waitFor( () => {
				expect( getByText( content ) ).toBeInTheDocument();
			} );

			Object.entries( STEP_CONTENT )
				.filter( ( [ otherStep ] ) => otherStep !== step )
				.forEach( ( [ , otherContent ] ) => {
					expect(
						queryByText( otherContent )
					).not.toBeInTheDocument();
				} );
		}
	);

	it( 'renders no step content for an unknown step', () => {
		global.location.href = 'http://example.com/?step=unknown-step';

		const { getByText, queryByText } = render( <ExpressSetupDefault />, {
			registry,
		} );

		expect( getByText( 'Connect publication' ) ).toBeInTheDocument();

		Object.values( STEP_CONTENT ).forEach( ( content ) => {
			expect( queryByText( content ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'should show the permissions modal after consent and retry only on Proceed', async () => {
		global.location.href =
			'http://example.com/?notification=authentication_success&step=connect-publication';

		provideUserAuthentication( registry );

		registry
			.dispatch( CORE_USER )
			.receiveConnectURL( 'http://example.com/connect' );

		const { getByText, getByRole } = render(
			<Fragment>
				<ExpressSetupDefault />
				<AuthenticatedPermissionsModal />
			</Fragment>,
			{ registry }
		);

		expect(
			getByText(
				'Additional permissions are required to set up Reader Revenue Manager.'
			)
		).toBeInTheDocument();

		expect(
			getByText( STEP_CONTENT[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ] )
		).toBeInTheDocument();

		expect( global.location.assign ).not.toHaveBeenCalled();

		fireEvent.click( getByRole( 'button', { name: 'Proceed' } ) );

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalledWith(
				expect.stringContaining( 'http://example.com/connect?' )
			);
		} );

		const connectURL = ( global.location.assign as jest.Mock ).mock
			.calls[ 0 ][ 0 ];

		expect( connectURL ).toMatchQueryParameters( {
			'additional_scopes[0]': EXPRESS_SETUP_SCOPES[ 0 ].replace(
				'https:',
				'gttps:'
			),
			'additional_scopes[1]': EXPRESS_SETUP_SCOPES[ 1 ].replace(
				'https:',
				'gttps:'
			),
		} );

		expect(
			new URL( connectURL ).searchParams.has( 'errorRedirect' )
		).toBe( false );
	} );

	it( 'should allow cancelling when only the required read-only scope is missing', async () => {
		global.location.href =
			'http://example.com/?notification=authentication_success&step=connect-publication';

		provideUserAuthentication( registry, {
			grantedScopes: [ EXPRESS_SETUP_SCOPES[ 1 ] ],
			requiredScopes: [ EXPRESS_SETUP_SCOPES[ 0 ] ],
			unsatisfiedScopes: [ EXPRESS_SETUP_SCOPES[ 0 ] ],
		} );

		const { getByRole, queryByRole, getByText, rerender } = render(
			<Fragment>
				<ExpressSetupDefault />
				<AuthenticatedPermissionsModal />
			</Fragment>,
			{ registry }
		);

		expect(
			getByRole( 'button', { name: 'Proceed' } )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

		await waitFor( () => {
			expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		rerender(
			<Fragment>
				<ExpressSetupDefault />
				<AuthenticatedPermissionsModal />
			</Fragment>
		);
		expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();

		expect(
			getByText( STEP_CONTENT[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ] )
		).toBeInTheDocument();

		expect( global.location.assign ).not.toHaveBeenCalled();
	} );
} );
