/**
 * Reader Revenue Manager express setup hooks tests.
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
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	render,
	renderHook,
} from '@tests/js/test-utils';
import { useStep } from './hooks';

// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
const PUBLICATION_ID = publications[ 0 ].publicationId;

const settingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
);

const publicationEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication'
);

// `publications[ 2 ]` has not accepted the terms of service; `publications[ 0 ]`
// has, and is the base for the policy-URL states below, neither of which any
// fixture publication has set.
const publicationWithoutTerms = publications[ 2 ] as Publication;
const publicationWithTerms = publications[ 0 ] as Publication;

/* eslint-disable sitekit/acronym-case -- `Url` is the identifier used by the API. */
const publicationWithOnePolicy = {
	...publicationWithTerms,
	publicationTosUrl: 'https://example.com/terms',
} as Publication;

const publicationWithPolicies = {
	...publicationWithTerms,
	publicationTosUrl: 'https://example.com/terms',
	publicationPrivacyPolicyUrl: 'https://example.com/privacy',
} as Publication;
/* eslint-enable sitekit/acronym-case */

function TestComponent() {
	const [ step, setStep ] = useStep();

	return createElement(
		'button',
		{
			onClick: () => setStep( EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ),
			type: 'button',
		},
		step
	);
}

describe( 'useStep', () => {
	mockLocation();

	let registry: Registry;

	/**
	 * Seeds the registry with resolved settings, and the connected publication
	 * when one is given, so that the hook never triggers a network request.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} [publication] Optional. Connected publication.
	 * @return {void}
	 */
	function provideConnectedPublication( publication?: Publication ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
				publicationID: publication ? publication.publicationId : '',
			} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		providePublications( registry, publication ? [ publication ] : [] );
	}

	function renderUseStep() {
		return renderHook( () => useStep(), { registry } );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'reactively updates the step when setStep is called', () => {
		global.location.href = 'http://example.com/';
		provideConnectedPublication( publicationWithPolicies );

		const { getByRole } = render( createElement( TestComponent ), {
			registry,
		} );
		const button = getByRole( 'button' );

		fireEvent.click( button );

		expect( button ).toHaveTextContent(
			EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
		);
	} );

	it( 'uses the step query parameter as the initial value', () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`;
		provideConnectedPublication();

		const { getByRole } = render( createElement( TestComponent ), {
			registry,
		} );

		expect( getByRole( 'button' ) ).toHaveTextContent(
			EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION
		);
	} );

	describe( 'entering the flow without a step', () => {
		beforeEach( () => {
			global.location.href = 'http://example.com/';
		} );

		it( 'should resolve to the connect publication step when no publication is connected', () => {
			provideConnectedPublication();

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION
			);
		} );

		it( 'should resolve to the terms of service step when the terms have not been accepted', () => {
			provideConnectedPublication( publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should resolve to the publication policies step when no policy URLs are set', () => {
			provideConnectedPublication( publicationWithTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES
			);
		} );

		it( 'should resolve to the publication policies step when only one policy URL is set', () => {
			provideConnectedPublication( publicationWithOnePolicy );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES
			);
		} );

		it( 'should resolve to the setup complete step when every step is complete', () => {
			provideConnectedPublication( publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );

		it( 'should resolve to the CTA setup step when every step is complete and a CTA is requested', () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';
			provideConnectedPublication( publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe( EXPRESS_SETUP_STEPS.SETUP_CTA );
		} );

		it( 'should resolve to the setup complete step when the CTA requested is not a recognised one', () => {
			global.location.href = 'http://example.com/?cta=not-a-real-cta';
			provideConnectedPublication( publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );

		it( 'should ignore the CTA argument while an earlier step is incomplete', () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';
			provideConnectedPublication( publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );
	} );

	describe( 'resuming the flow with a step', () => {
		it( 'should redirect back to an earlier incomplete step', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			provideConnectedPublication();

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION
			);
		} );

		it( 'should redirect back to the first incomplete step, not the nearest one', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES }`;
			provideConnectedPublication( publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should leave the current step untouched when it is the first incomplete step', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE }`;
			provideConnectedPublication( publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should leave the current step untouched when every earlier step is complete', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			provideConnectedPublication( publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );

		it( 'should redirect back from an unrecognised step', () => {
			global.location.href = 'http://example.com/?step=some-unknown-step';
			provideConnectedPublication( publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should not pull the user back to the CTA setup step from setup complete', () => {
			global.location.href = `http://example.com/?cta=newsletter-signup&step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			provideConnectedPublication( publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );
	} );

	describe( 'while the data is loading', () => {
		it( 'should not navigate while the settings are loading', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			freezeFetch( settingsEndpoint );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );

		it( 'should not navigate while the connected publication is loading', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			freezeFetch( publicationEndpoint );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID: PUBLICATION_ID } );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.finishResolution( 'getSettings', [] );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );
	} );
} );
