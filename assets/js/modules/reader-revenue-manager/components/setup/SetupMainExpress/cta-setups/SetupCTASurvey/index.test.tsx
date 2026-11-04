/**
 * Reader Revenue Manager SetupCTASurvey component tests.
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
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import SetupCTASurvey from './index';

jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/PoweredBy',
	() => () => null
);

// Renders the real publication setup step alongside a button that completes
// it, so that navigation can be tested without submitting the step's form.
jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationSetup',
	() => {
		const { createElement, Fragment } =
			jest.requireActual( '@wordpress/element' );
		const actual = jest.requireActual(
			'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationSetup'
		);

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
	}
);

const STEP_CONTENT = {
	'connect-publication':
		'To set up a survey using Reader Revenue Manager, you will need to create a publication.',
	'terms-of-service':
		'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.',
	'publication-policies':
		'To set up a survey using Reader Revenue Manager, you will need to add URLs to your publication’s policies.',
	'survey-questions': 'Survey questions placeholder',
	'survey-cta': 'Survey CTA placeholder',
	'setup-complete': 'Your survey is published!',
};

// Has accepted the terms of service and set both policy URLs.
const completePublication = publications[ 3 ] as Publication;

// Has not accepted the terms of service.
const publicationWithoutTerms = publications[ 2 ] as Publication;

/**
 * Connects the given publication with no CTAs.
 *
 * @since 1.191.0
 * @private
 *
 * @param {Object} registry    Registry to seed.
 * @param {Object} publication Publication to connect.
 * @return {void}
 */
function connectPublication( registry: Registry, publication: Publication ) {
	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
		.setPublicationID( publication.publicationId );

	providePublications( registry, [ publication ] );

	// CTAs are keyed by the publication ID, so receive them after setting it.
	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetCTAs( { ctas: [], params: {} } );
}

describe( 'SetupCTASurvey', () => {
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
			.receiveGetSettings( { publicationID: '' } );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		providePublications( registry, [] );

		provideSiteInfo( registry );
	} );

	it( 'renders its steps in order, with the survey steps before setup complete', async () => {
		global.location.href = 'http://example.com/';

		connectPublication( registry, publicationWithoutTerms );

		const { container, waitForRegistry } = render( <SetupCTASurvey />, {
			registry,
		} );

		await waitForRegistry();

		const steps = container.querySelectorAll(
			'.googlesitekit-stepper__step'
		);

		expect( steps ).toHaveLength( 6 );
		expect( steps[ 0 ] ).toHaveTextContent( 'Connect publication' );
		expect( steps[ 1 ] ).toHaveTextContent( 'Accept terms of service' );
		expect( steps[ 2 ] ).toHaveTextContent( 'Add publication policies' );
		expect( steps[ 3 ] ).toHaveTextContent( 'Survey questions' );
		expect( steps[ 4 ] ).toHaveTextContent( 'Survey CTA' );
		expect( steps[ 5 ] ).toHaveTextContent( 'Setup complete' );
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
				'http://example.com/?cta=survey&step=connect-publication';

			connectPublication( registry, publication as Publication );

			const { getByRole, getByText, waitForRegistry } = render(
				<SetupCTASurvey />,
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

	it.each( Object.entries( STEP_CONTENT ) )(
		'renders the %s step content',
		async ( step, content ) => {
			global.location.href = `http://example.com/?step=${ step }`;

			// Each step's copy depends on the connected publication.
			if ( step === 'terms-of-service' ) {
				connectPublication( registry, publicationWithoutTerms );
			} else if ( step !== 'connect-publication' ) {
				connectPublication( registry, completePublication );
			}

			const { getByText, queryByText } = render( <SetupCTASurvey />, {
				registry,
			} );

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

		const { getByText } = render( <SetupCTASurvey />, {
			registry,
		} );

		await waitFor( () => {
			expect(
				getByText( STEP_CONTENT[ 'connect-publication' ] )
			).toBeInTheDocument();
		} );

		expect( global.location.href ).toContain( 'step=connect-publication' );
	} );

	it( 'renders the "View on your site" CTA on the setup complete step', async () => {
		global.location.href = 'http://example.com/?step=setup-complete';

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { snippetMode: 'sitewide', postTypes: [] } );

		connectPublication( registry, completePublication );

		const { getByRole } = render( <SetupCTASurvey />, { registry } );

		await waitFor( () => {
			expect(
				getByRole( 'button', { name: /View on your site/i } )
			).toBeInTheDocument();
		} );
	} );
} );
