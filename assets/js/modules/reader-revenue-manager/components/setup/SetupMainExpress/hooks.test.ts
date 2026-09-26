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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import {
	providePublication,
	providePublications,
} from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	surveyTimeoutsEndpoint,
	surveyTriggerEndpoint,
} from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	muteFetch,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	renderHook,
	waitForDefaultTimeouts,
} from '@tests/js/test-utils';
import {
	useExpressSetupSurveyTriggers,
	useHasPreExistingCTAs,
	useStep,
} from './hooks';

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

/**
 * Seeds the registry with resolved settings, and the connected publication
 * when one is given, so that the hooks never trigger a network request.
 *
 * @since 1.188.0
 * @private
 *
 * @param {Object} registry      Registry to seed.
 * @param {Object} [publication] Optional. Connected publication.
 * @return {void}
 */
function provideConnectedPublication(
	registry: Registry,
	publication?: Publication
) {
	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
		publicationID: publication ? publication.publicationId : '',
	} );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.finishResolution( 'getSettings', [] );

	providePublications( registry, publication ? [ publication ] : [] );
}

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

function SurveyTriggerTestComponent() {
	useExpressSetupSurveyTriggers();

	const [ step, setStep ] = useStep();

	return createElement(
		'button',
		{
			onClick: () => setStep( EXPRESS_SETUP_STEPS.SETUP_COMPLETE ),
			type: 'button',
		},
		step
	);
}

describe( 'useStep', () => {
	mockLocation();

	let registry: Registry;

	function renderUseStep() {
		return renderHook( () => useStep(), { registry } );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'reactively updates the step when setStep is called', () => {
		global.location.href = 'http://example.com/';
		provideConnectedPublication( registry, publicationWithPolicies );

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
		provideConnectedPublication( registry );

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
			provideConnectedPublication( registry );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION
			);
		} );

		it( 'should resolve to the terms of service step when the terms have not been accepted', () => {
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should resolve to the publication policies step when no policy URLs are set', () => {
			provideConnectedPublication( registry, publicationWithTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES
			);
		} );

		it( 'should resolve to the publication policies step when only one policy URL is set', () => {
			provideConnectedPublication( registry, publicationWithOnePolicy );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES
			);
		} );

		it( 'should resolve to the setup complete step when every step is complete', () => {
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );

		it( 'should resolve to the CTA setup step when every step is complete and a CTA is requested', () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe( EXPRESS_SETUP_STEPS.SETUP_CTA );
		} );

		it( 'should resolve to the setup complete step when the CTA requested is not a recognised one', () => {
			global.location.href = 'http://example.com/?cta=not-a-real-cta';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );

		it( 'should ignore the CTA argument while an earlier step is incomplete', () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );
	} );

	describe( 'resuming the flow with a step', () => {
		it( 'should redirect back to an earlier incomplete step', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			provideConnectedPublication( registry );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION
			);
		} );

		it( 'should redirect back to the first incomplete step, not the nearest one', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES }`;
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should leave the current step untouched when it is the first incomplete step', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE }`;
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should leave the current step untouched when every earlier step is complete', () => {
			global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.SETUP_COMPLETE
			);
		} );

		it( 'should redirect back from an unrecognised step', () => {
			global.location.href = 'http://example.com/?step=some-unknown-step';
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseStep();

			expect( result.current[ 0 ] ).toBe(
				EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
			);
		} );

		it( 'should not pull the user back to the CTA setup step from setup complete', () => {
			global.location.href = `http://example.com/?cta=newsletter-signup&step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
			provideConnectedPublication( registry, publicationWithPolicies );

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

			// Prevent another request from being made to the publication endpoint.
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.finishResolution( 'getPublication', [ {} ] );
		} );
	} );
} );

describe( 'useHasPreExistingCTAs', () => {
	let registry: WPDataRegistry;

	const ctasEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
	);

	const cta = {
		name: `organizations/ABCD1234/publications/${ PUBLICATION_ID }/ctas/9d2418415-ab3a`,
		type: 'NEWSLETTER_SIGNUP',
	};

	const otherCTA = {
		name: `organizations/ABCD1234/publications/${ PUBLICATION_ID }/ctas/8j8152411-cd4b`,
		type: 'NEWSLETTER_SIGNUP',
	};

	beforeEach( () => {
		registry = createTestRegistry();
		providePublication( registry, publications[ 0 ] );
	} );

	it( 'returns undefined while the CTAs are loading', () => {
		muteFetch( ctasEndpoint );

		const { result, unmount } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBeUndefined();

		unmount();
	} );

	it( 'returns false when there are no configured CTAs', () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [],
			params: { publicationID: PUBLICATION_ID },
		} );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'returns false when there is only the CTA just created in this setup flow', () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [ cta ],
			params: { publicationID: PUBLICATION_ID },
		} );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'returns true when there is more than one configured CTA', () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [ cta, otherCTA ],
			params: { publicationID: PUBLICATION_ID },
		} );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( true );
	} );
} );

describe( 'useExpressSetupSurveyTriggers', () => {
	mockLocation();

	const STARTED_TRIGGER_ID = `rrm_${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }_express_setup_started`;
	const COMPLETED_TRIGGER_ID = `rrm_${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }_express_setup_completed`;

	let registry: Registry;

	/**
	 * Counts the survey trigger requests made for the given trigger ID.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} triggerID Survey trigger ID.
	 * @return {number} Number of requests made.
	 */
	function countTriggerRequests( triggerID: string ): number {
		return fetchMock
			.calls( surveyTriggerEndpoint )
			.filter( ( call ) =>
				String( call[ 1 ]?.body ).includes( triggerID )
			).length;
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideUserAuthentication( registry );
		provideSiteInfo( registry );

		// Not the shared `mockSurveyEndpoints()` helper: it mocks a single
		// request of each kind, and both triggers fire within one render here.
		fetchMock.get( surveyTimeoutsEndpoint, { status: 200, body: [] } );
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
	} );

	it( 'should trigger the started survey when opened with a recognised CTA', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;
		provideConnectedPublication( registry );

		const { waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID: STARTED_TRIGGER_ID } },
		} );
	} );

	it( 'should trigger the started survey only once as the flow advances', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;
		provideConnectedPublication( registry, publicationWithPolicies );

		const { getByRole, waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( countTriggerRequests( STARTED_TRIGGER_ID ) ).toBe( 1 );

		fireEvent.click( getByRole( 'button' ) );

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( countTriggerRequests( STARTED_TRIGGER_ID ) ).toBe( 1 );
	} );

	it( 'should trigger the completed survey when the flow reaches the setup complete step', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;
		provideConnectedPublication( registry, publicationWithPolicies );

		const { getByRole, waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( countTriggerRequests( COMPLETED_TRIGGER_ID ) ).toBe( 0 );

		fireEvent.click( getByRole( 'button' ) );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID: COMPLETED_TRIGGER_ID } },
		} );
	} );

	it( 'should trigger the completed survey when entering on the setup complete step', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }&step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
		provideConnectedPublication( registry, publicationWithPolicies );

		const { waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID: COMPLETED_TRIGGER_ID } },
		} );
	} );

	it( 'should not trigger either survey when no CTA is specified', async () => {
		global.location.href = 'http://example.com/';
		provideConnectedPublication( registry );

		const { waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );

	it( 'should not trigger either survey for an unrecognised CTA', async () => {
		global.location.href = 'http://example.com/?cta=not-a-real-cta';
		provideConnectedPublication( registry );

		const { waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );

	it( 'should not trigger either survey when the default flow reaches the setup complete step', async () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;
		provideConnectedPublication( registry, publicationWithPolicies );

		const { waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );
} );
