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
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import {
	providePublication,
	providePublications,
} from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import ExpressSetupDefault from './ExpressSetupDefault';

jest.mock( './PoweredBy', () => () => null );

// Renders the real publication setup step alongside a button that completes
// it, so that navigation can be tested without submitting the step's form.
jest.mock( './common-steps/StepPublicationSetup', () => {
	const { createElement, Fragment } =
		jest.requireActual( '@wordpress/element' );
	const actual = jest.requireActual( './common-steps/StepPublicationSetup' );

	return {
		...actual,
		publicationSetupStep: {
			...actual.publicationSetupStep,
			Component: ( props: { onComplete: () => void } ) =>
				createElement(
					Fragment,
					null,
					createElement( actual.default, props ),
					createElement(
						'button',
						{ onClick: props.onComplete, type: 'button' },
						'Test: complete step'
					)
				),
		},
	};
} );

const STEP_CONTENT = {
	'connect-publication':
		'To use Reader Revenue Manager, you will need to create a publication.',
	'terms-of-service':
		'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.',
	'publication-policies':
		'To use Reader Revenue Manager, you will need to add links to your publication’s policies.',
	'setup-complete': 'Reader Revenue Manager is set up',
};

// Has accepted the terms of service and set both policy URLs.
const completePublication = publications[ 3 ] as Publication;

// Has not accepted the terms of service.
const publicationWithoutTerms = publications[ 2 ] as Publication;

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

	it( 'renders the default steps in order, without a CTA step', () => {
		global.location.href = 'http://example.com/';

		providePublication( registry, completePublication );

		const { container } = render( <ExpressSetupDefault />, { registry } );

		const steps = container.querySelectorAll(
			'.googlesitekit-stepper__step'
		);

		expect( steps ).toHaveLength( 4 );
		expect( steps[ 0 ] ).toHaveTextContent( 'Connect publication' );
		expect( steps[ 1 ] ).toHaveTextContent( 'Accept terms of service' );
		expect( steps[ 2 ] ).toHaveTextContent( 'Add publication policies' );
		expect( steps[ 3 ] ).toHaveTextContent( 'Setup complete' );
	} );

	it.each( Object.entries( STEP_CONTENT ) )(
		'renders the %s step content',
		async ( step, content ) => {
			global.location.href = `http://example.com/?step=${ step }`;

			// Each step's copy depends on the connected publication.
			if ( step === 'connect-publication' ) {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( { publicationID: '' } );
			} else if ( step === 'terms-of-service' ) {
				providePublication( registry, publicationWithoutTerms );
			} else {
				providePublication( registry, completePublication );
			}

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

	it( 'redirects an unknown step to the first incomplete step', async () => {
		global.location.href = 'http://example.com/?step=unknown-step';

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { publicationID: '' } );

		const { getByText } = render( <ExpressSetupDefault />, {
			registry,
		} );

		await waitFor( () => {
			expect(
				getByText( STEP_CONTENT[ 'connect-publication' ] )
			).toBeInTheDocument();
		} );

		expect( global.location.href ).toContain( 'step=connect-publication' );
	} );

	describe( 'completing a step', () => {
		// `publications[ 2 ]` has not accepted the terms of service;
		// `publications[ 0 ]` has.
		it.each( [
			[
				'passes over the terms of service step when the terms are already accepted',
				publications[ 0 ],
				STEP_CONTENT[ 'publication-policies' ],
			],
			[
				'advances to the terms of service step when the terms are not accepted',
				publications[ 2 ],
				STEP_CONTENT[ 'terms-of-service' ],
			],
		] )( '%s', async ( _, publication, expectedContent ) => {
			global.location.href =
				'http://example.com/?step=connect-publication';

			providePublication( registry, publication as Publication );

			const { getByRole, getByText, waitForRegistry } = render(
				<ExpressSetupDefault />,
				{ registry }
			);

			await waitForRegistry();

			fireEvent.click(
				getByRole( 'button', { name: 'Test: complete step' } )
			);

			await waitFor( () => {
				expect( getByText( expectedContent ) ).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'while the initial step is unresolved', () => {
		const authenticationEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/authentication'
		);
		const settingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
		);
		const publicationEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication'
		);

		const errorResponse = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		};

		const ERROR_TITLE = 'We couldn’t set up Reader Revenue Manager';

		/**
		 * Sets up a registry without resolved settings or publication.
		 *
		 * @since 1.191.0
		 * @private
		 *
		 * @param {Object}         [options]               Optional. Options.
		 * @param {Array.<string>} [options.grantedScopes] Optional. Granted scopes; omit to leave them loading.
		 * @return {void}
		 */
		function setupRegistry( {
			grantedScopes,
		}: { grantedScopes?: string[] } = {} ) {
			registry = createTestRegistry() as Registry;

			if ( grantedScopes ) {
				provideUserAuthentication( registry, { grantedScopes } );
			} else {
				freezeFetch( authenticationEndpoint );
			}

			const moduleData = [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: false,
				},
			];

			provideModules( registry, moduleData );
			provideModuleRegistrations( registry, moduleData );
			providePublications( registry, [] );
		}

		/**
		 * Resolves the settings with the given publication ID.
		 *
		 * @since 1.191.0
		 * @private
		 *
		 * @param {string} publicationID Publication ID.
		 * @return {void}
		 */
		function provideSettings( publicationID: string ) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID } );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.finishResolution( 'getSettings', [] );
		}

		/**
		 * Asserts that only the progress bar is rendered.
		 *
		 * @since 1.191.0
		 * @private
		 *
		 * @param {Element} container Rendered container.
		 * @return {void}
		 */
		function expectOnlyProgressBar( container: Element ) {
			expect(
				container.querySelector( '.mdc-linear-progress' )
			).toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-stepper' )
			).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-rrm-express-setup-step__headline'
				)
			).not.toBeInTheDocument();
		}

		beforeEach( () => {
			global.location.href = 'http://example.com/';
		} );

		it( 'should show only a progress bar while the settings are loading', () => {
			setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
			freezeFetch( settingsEndpoint );

			const { container } = render( <ExpressSetupDefault />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while the connected publication is loading', () => {
			setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			provideSettings( publicationWithoutTerms.publicationId );
			freezeFetch( publicationEndpoint );

			const { container } = render( <ExpressSetupDefault />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while the granted scopes are loading', () => {
			setupRegistry();
			provideSettings( '' );

			const { container } = render( <ExpressSetupDefault />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while a required scope is missing, when no publication is connected', () => {
			setupRegistry( { grantedScopes: [] } );
			provideSettings( '' );

			const { container } = render( <ExpressSetupDefault />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while a required scope is missing, when the publication request has failed', async () => {
			setupRegistry( { grantedScopes: [] } );
			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			provideSettings( publicationWithoutTerms.publicationId );

			fetchMock.getOnce( publicationEndpoint, {
				body: {
					code: 'forbidden',
					message: 'Missing required scopes.',
					data: { status: 403 },
				},
				status: 403,
			} );

			const { container, waitForRegistry } = render(
				<ExpressSetupDefault />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched( publicationEndpoint );
			expect(
				registry.select( MODULES_READER_REVENUE_MANAGER ).hasErrors()
			).toBe( true );
			expectOnlyProgressBar( container );
			expect( console ).toHaveErrored();
		} );

		it.each( [
			[
				'settings',
				settingsEndpoint,
				() => undefined,
				{ publicationID: '' },
				'.googlesitekit-stepper__step--active',
			],
			[
				'connected publication',
				publicationEndpoint,
				() =>
					// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
					provideSettings( publicationWithoutTerms.publicationId ),
				publicationWithoutTerms,
				'.googlesitekit-stepper__step--active',
			],
		] )(
			'should show the error with a Retry button when the %s request fails, and recover once it succeeds',
			async (
				_,
				endpoint,
				provideData,
				successResponse,
				activeStepSelector
			) => {
				setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
				provideData();

				fetchMock.getOnce( endpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { container, getByRole, getByText } = render(
					<ExpressSetupDefault />,
					{ registry }
				);

				await waitFor( () => {
					expect( getByText( ERROR_TITLE ) ).toBeInTheDocument();
				} );

				expect(
					getByText( /Internal server error/ )
				).toBeInTheDocument();
				expect(
					container.querySelector( '.mdc-linear-progress' )
				).not.toBeInTheDocument();
				expect(
					container.querySelector( '.googlesitekit-stepper' )
				).not.toBeInTheDocument();
				expect( console ).toHaveErrored();

				let respond: ( ( response: object ) => void ) | undefined;

				fetchMock.getOnce(
					endpoint,
					new Promise( ( resolve ) => {
						respond = resolve;
					} )
				);

				fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

				await waitFor( () => {
					expectOnlyProgressBar( container );
				} );

				expect(
					container.querySelector( '.googlesitekit-notice' )
				).not.toBeInTheDocument();

				await act( async () => {
					respond?.( { body: successResponse, status: 200 } );
					await waitFor( () => {
						expect(
							container.querySelector( activeStepSelector )
						).toBeInTheDocument();
					} );
				} );

				expect(
					container.querySelector( '.mdc-linear-progress' )
				).not.toBeInTheDocument();
				expect(
					container.querySelector(
						'.googlesitekit-rrm-express-setup__content'
					)
				).not.toBeEmptyDOMElement();
			}
		);

		it( 'should show the stepper and the step once the scopes are granted and the step has resolved', async () => {
			setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
			provideSettings( '' );

			const { container, waitForRegistry } = render(
				<ExpressSetupDefault />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				container.querySelector( '.googlesitekit-stepper' )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-rrm-express-setup-step__headline'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-rrm-express-setup__content > .mdc-linear-progress'
				)
			).not.toBeInTheDocument();
		} );
	} );
} );
