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
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
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

describe( 'ExpressSetupDefault', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

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

			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			const publicationID = publication.publicationId;

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID } );

			providePublications( registry, [ publication ] );

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
} );
