/**
 * Reader Revenue Manager express setup `useSetupFlow` hook tests.
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
import { Registry, Select } from '@/js/googlesitekit-data';
import {
	publicationPoliciesStep,
	publicationSetupStep,
	setupCompleteStep,
	termsOfServiceStep,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import { signupFormStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/StepSignupForm';
import { SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	actHook,
	createTestRegistry,
	freezeFetch,
	renderHook,
} from '@tests/js/test-utils';
import useSetupFlow, { findBlockingStep, resolveStep } from './useSetupFlow';

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

const DEFAULT_FLOW: SetupStep[] = [
	publicationSetupStep,
	termsOfServiceStep,
	publicationPoliciesStep,
	setupCompleteStep,
];

const NEWSLETTER_FLOW: SetupStep[] = [
	publicationSetupStep,
	termsOfServiceStep,
	publicationPoliciesStep,
	signupFormStep,
	setupCompleteStep,
];

function StepContent() {
	return null;
}

/**
 * Creates a step definition for testing.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {string}  slug                 Step slug.
 * @param {Object}  [options]            Optional. Step options.
 * @param {boolean} [options.isComplete] Optional. Whether the step is complete. Omit for a step without completion criteria.
 * @return {Object} Step definition.
 */
function createStep(
	slug: string,
	{ isComplete }: { isComplete?: boolean } = {}
): SetupStep {
	return {
		slug,
		label: slug,
		Component: StepContent,
		...( isComplete === undefined ? {} : { isComplete: () => isComplete } ),
	};
}

/**
 * Seeds the registry with resolved settings, and the connected publication
 * when one is given, so that the hook never triggers a network request.
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

describe( 'resolveStep', () => {
	const select = jest.fn() as Select;

	it( 'should return the first step that is not yet complete', () => {
		const steps = [
			createStep( 'first', { isComplete: true } ),
			createStep( 'second', { isComplete: false } ),
			createStep( 'third', { isComplete: false } ),
		];

		expect( resolveStep( steps, select )?.slug ).toBe( 'second' );
	} );

	it( 'should treat a step without completion criteria as a valid target', () => {
		const steps = [
			createStep( 'first', { isComplete: true } ),
			createStep( 'cta' ),
			createStep( 'complete' ),
		];

		expect( resolveStep( steps, select )?.slug ).toBe( 'cta' );
	} );

	it( 'should resolve from the given index, passing over earlier steps', () => {
		const steps = [
			createStep( 'first', { isComplete: false } ),
			createStep( 'second', { isComplete: true } ),
			createStep( 'third', { isComplete: false } ),
		];

		expect( resolveStep( steps, select, 1 )?.slug ).toBe( 'third' );
	} );

	it( 'should return undefined when every step from the given index is complete', () => {
		const steps = [
			createStep( 'first', { isComplete: false } ),
			createStep( 'second', { isComplete: true } ),
		];

		expect( resolveStep( steps, select, 1 ) ).toBeUndefined();
	} );
} );

describe( 'findBlockingStep', () => {
	const select = jest.fn() as Select;

	it( 'should return the first step whose completion criteria are unmet', () => {
		const steps = [
			createStep( 'first', { isComplete: true } ),
			createStep( 'second', { isComplete: false } ),
			createStep( 'third', { isComplete: false } ),
		];

		expect( findBlockingStep( steps, select )?.slug ).toBe( 'second' );
	} );

	it( 'should ignore steps without completion criteria', () => {
		const steps = [
			createStep( 'cta' ),
			createStep( 'second', { isComplete: false } ),
			createStep( 'complete' ),
		];

		expect( findBlockingStep( steps, select )?.slug ).toBe( 'second' );
	} );

	it( 'should return undefined when every step with completion criteria is complete', () => {
		const steps = [
			createStep( 'first', { isComplete: true } ),
			createStep( 'cta' ),
			createStep( 'complete' ),
		];

		expect( findBlockingStep( steps, select ) ).toBeUndefined();
	} );
} );

describe( 'useSetupFlow', () => {
	mockLocation();

	let registry: Registry;

	function renderUseSetupFlow( steps: SetupStep[] = DEFAULT_FLOW ) {
		return renderHook( () => useSetupFlow( steps ), { registry } );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	describe( 'entering the flow without a step', () => {
		beforeEach( () => {
			global.location.href = 'http://example.com/';
		} );

		it( 'should open the connect publication step when no publication is connected', () => {
			provideConnectedPublication( registry );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( publicationSetupStep );
		} );

		it( 'should open the terms of service step when the terms have not been accepted', () => {
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( termsOfServiceStep );
		} );

		it( 'should open the publication policies step when no policy URLs are set', () => {
			provideConnectedPublication( registry, publicationWithTerms );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe(
				publicationPoliciesStep
			);
		} );

		it( 'should open the publication policies step when only one policy URL is set', () => {
			provideConnectedPublication( registry, publicationWithOnePolicy );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe(
				publicationPoliciesStep
			);
		} );

		it( 'should open the setup complete step when every step of the default flow is complete', () => {
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( setupCompleteStep );
		} );

		it( 'should open the CTA step when every earlier step of a CTA flow is complete', () => {
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow( NEWSLETTER_FLOW );

			expect( result.current.currentStep ).toBe( signupFormStep );
		} );

		it( 'should open an earlier incomplete step rather than the CTA step', () => {
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseSetupFlow( NEWSLETTER_FLOW );

			expect( result.current.currentStep ).toBe( termsOfServiceStep );
		} );
	} );

	describe( 'resuming the flow with a step', () => {
		it( 'should redirect back to an earlier incomplete step', () => {
			global.location.href = 'http://example.com/?step=setup-complete';
			provideConnectedPublication( registry );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( publicationSetupStep );
		} );

		it( 'should redirect back to the first incomplete step, not the nearest one', () => {
			global.location.href =
				'http://example.com/?step=publication-policies';
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( termsOfServiceStep );
		} );

		it( 'should leave the current step untouched when it is the first incomplete step', () => {
			global.location.href = 'http://example.com/?step=terms-of-service';
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( termsOfServiceStep );
		} );

		it( 'should leave the current step untouched when a later step is incomplete', () => {
			global.location.href = 'http://example.com/?step=terms-of-service';
			provideConnectedPublication( registry, publicationWithTerms );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( termsOfServiceStep );
		} );

		it( 'should honour a requested step that is already complete', () => {
			global.location.href =
				'http://example.com/?step=connect-publication';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( publicationSetupStep );
		} );

		it( 'should honour the setup complete step when every earlier step is complete', () => {
			global.location.href = 'http://example.com/?step=setup-complete';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( setupCompleteStep );
		} );

		it( 'should not pull the user back to the CTA step from setup complete', () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=setup-complete';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow( NEWSLETTER_FLOW );

			expect( result.current.currentStep ).toBe( setupCompleteStep );
		} );

		it( 'should redirect from an unrecognised step to the first incomplete step', () => {
			global.location.href = 'http://example.com/?step=some-unknown-step';
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( termsOfServiceStep );
		} );

		it( 'should redirect from an unrecognised step to the CTA step when every earlier step is complete', () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=setup-cta';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow( NEWSLETTER_FLOW );

			expect( result.current.currentStep ).toBe( signupFormStep );
		} );

		it( 'should redirect from a step that belongs to another flow', () => {
			global.location.href = `http://example.com/?step=${ signupFormStep.slug }`;
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( setupCompleteStep );
		} );
	} );

	describe( 'while the data is loading', () => {
		it( 'should not navigate while the settings are loading', () => {
			global.location.href = 'http://example.com/?step=setup-complete';
			freezeFetch( settingsEndpoint );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( setupCompleteStep );
		} );

		it( 'should not navigate while the connected publication is loading', () => {
			global.location.href = 'http://example.com/?step=setup-complete';
			freezeFetch( publicationEndpoint );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID: PUBLICATION_ID } );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.finishResolution( 'getSettings', [] );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBe( setupCompleteStep );

			// Prevent another request from being made to the publication endpoint.
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.finishResolution( 'getPublication', [ {} ] );
		} );

		it( 'should not open a step before the settings have loaded', () => {
			global.location.href = 'http://example.com/';
			freezeFetch( settingsEndpoint );

			const { result } = renderUseSetupFlow();

			expect( result.current.currentStep ).toBeUndefined();
		} );
	} );

	describe( 'completing a step', () => {
		it( 'should pass over the terms of service step on completing the connect publication step, when the terms are already accepted', () => {
			global.location.href =
				'http://example.com/?step=connect-publication';
			provideConnectedPublication( registry, publicationWithTerms );

			const { result } = renderUseSetupFlow();

			actHook( () => result.current.advance() );

			expect( result.current.currentStep ).toBe(
				publicationPoliciesStep
			);
		} );

		it( 'should open the terms of service step on completing the connect publication step, when the terms are not accepted', () => {
			global.location.href =
				'http://example.com/?step=connect-publication';
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseSetupFlow();

			actHook( () => result.current.advance() );

			expect( result.current.currentStep ).toBe( termsOfServiceStep );
		} );

		it( 'should read the latest state at the moment the step completes', () => {
			global.location.href =
				'http://example.com/?step=connect-publication';
			provideConnectedPublication( registry, publicationWithoutTerms );

			const { result } = renderUseSetupFlow();

			// Captured before the terms are accepted, as a step's `onComplete`
			// handler would be.
			const { advance } = result.current;

			actHook( () => {
				providePublications( registry, [
					{
						...publicationWithoutTerms,
						rrmProduct: publicationWithTerms.rrmProduct,
					},
				] );
				advance();
			} );

			expect( result.current.currentStep ).toBe(
				publicationPoliciesStep
			);
		} );

		it( 'should open the setup complete step on completing the publication policies step in the default flow', () => {
			global.location.href =
				'http://example.com/?step=publication-policies';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow();

			actHook( () => result.current.advance() );

			expect( result.current.currentStep ).toBe( setupCompleteStep );
		} );

		it( 'should open the CTA step on completing the publication policies step in a CTA flow', () => {
			global.location.href =
				'http://example.com/?step=publication-policies';
			provideConnectedPublication( registry, publicationWithPolicies );

			const { result } = renderUseSetupFlow( NEWSLETTER_FLOW );

			actHook( () => result.current.advance() );

			expect( result.current.currentStep ).toBe( signupFormStep );
		} );

		it( 'should open each CTA step in order as the previous one is completed', () => {
			global.location.href = 'http://example.com/';
			provideConnectedPublication( registry, publicationWithPolicies );

			const firstCTAStep = createStep( 'first-cta' );
			const secondCTAStep = createStep( 'second-cta' );
			const steps = [
				publicationSetupStep,
				termsOfServiceStep,
				publicationPoliciesStep,
				firstCTAStep,
				secondCTAStep,
				setupCompleteStep,
			];

			const { result } = renderUseSetupFlow( steps );

			expect( result.current.currentStep ).toBe( firstCTAStep );

			actHook( () => result.current.advance() );

			expect( result.current.currentStep ).toBe( secondCTAStep );

			actHook( () => result.current.advance() );

			expect( result.current.currentStep ).toBe( setupCompleteStep );
		} );
	} );
} );
