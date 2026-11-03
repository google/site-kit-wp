/**
 * Reader Revenue Manager express setup `useCreateExpressSetupCTA` hook tests.
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
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import useCreateExpressSetupCTA from './useCreateExpressSetupCTA';

const settingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
);
const publicationEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication(?:\\?|$)'
);
const ctasEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
);
const createCTAEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-cta'
);

const createdCTA = {
	name: 'organizations/ABCD1234/publications/ABCDEFGH/ctas/1',
	type: CTA_TYPES.NEWSLETTER_SIGNUP,
};

const params = {
	data: {
		displayName: 'Newsletter signup',
		type: CTA_TYPES.NEWSLETTER_SIGNUP,
		config: { nameRequired: false },
	},
};

const initialSettings = {
	publicationID: 'ABCDEFGH',
	organizationID: 'ABCD1234',
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED,
	publicationOnboardingStateChanged: true,
	productID: 'openaccess',
	productIDs: [],
	paymentOption: '',
};

// The publication is live once the CTA exists.
const livePublication = {
	...publications[ 0 ],
	onboardingState: PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};

describe( 'useCreateExpressSetupCTA', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( initialSettings );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );
	} );

	// The settings the store held when the save request was sent.
	let settingsAtSave: Record< string, unknown > | undefined;

	function mockSuccessfulRequests() {
		settingsAtSave = undefined;

		fetchMock.postOnce( createCTAEndpoint, {
			body: createdCTA,
			status: 200,
		} );
		fetchMock.getOnce( publicationEndpoint, {
			body: livePublication,
			status: 200,
		} );
		fetchMock.getOnce( ctasEndpoint, {
			body: [ createdCTA ],
			status: 200,
		} );
		fetchMock.postOnce( settingsEndpoint, ( url, opts ) => {
			settingsAtSave = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSettings();

			return {
				body: JSON.parse( opts.body as string ).data,
				status: 200,
			};
		} );
	}

	it( 'should request the publication and CTAs once each, then save settings with the onboarding state change cleared', async () => {
		mockSuccessfulRequests();

		const { result } = renderHook( () => useCreateExpressSetupCTA(), {
			registry,
			features: [ 'rrmExpressSetup' ],
		} );

		await result.current( params );

		expect( fetchMock ).toHaveFetchedTimes( 1, publicationEndpoint );
		expect( fetchMock ).toHaveFetchedTimes( 1, ctasEndpoint );
		expect( fetchMock ).toHaveFetchedTimes( 1, settingsEndpoint );
		const [ , options ] = fetchMock.lastCall( settingsEndpoint ) as [
			string,
			{ body: string }
		];

		expect( JSON.parse( options.body ).data ).toMatchObject( {
			publicationOnboardingStateChanged: false,
		} );
	} );

	it( 'should hold the onboarding state and configured CTAs from the responses in the settings', async () => {
		mockSuccessfulRequests();

		const { result } = renderHook( () => useCreateExpressSetupCTA(), {
			registry,
			features: [ 'rrmExpressSetup' ],
		} );

		await result.current( params );

		expect( settingsAtSave ).toMatchObject( {
			publicationOnboardingState:
				PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			publicationOnboardingStateChanged: false,
			configuredCTAs: { 1: 'newsletter-signup' },
		} );
	} );

	it( 'should resolve to the created CTA', async () => {
		mockSuccessfulRequests();

		const { result } = renderHook( () => useCreateExpressSetupCTA(), {
			registry,
			features: [ 'rrmExpressSetup' ],
		} );

		await expect( result.current( params ) ).resolves.toEqual( {
			response: createdCTA,
			error: undefined,
		} );
	} );

	it( 'should resolve to the created CTA when the publication or CTAs request fails', async () => {
		const error = {
			code: 'internal_server_error',
			message: 'Request failed',
			data: { status: 500 },
		};

		fetchMock.postOnce( createCTAEndpoint, {
			body: createdCTA,
			status: 200,
		} );
		fetchMock.getOnce( publicationEndpoint, { body: error, status: 500 } );
		fetchMock.getOnce( ctasEndpoint, { body: error, status: 500 } );
		fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
			body: JSON.parse( opts.body as string ).data,
			status: 200,
		} ) );

		const { result } = renderHook( () => useCreateExpressSetupCTA(), {
			registry,
			features: [ 'rrmExpressSetup' ],
		} );

		const { response, error: createError } = await result.current( params );

		expect( response ).toEqual( createdCTA );
		expect( createError ).toBeUndefined();
		expect( console ).toHaveErrored();
	} );

	it( 'should resolve to the error and make no further requests when creating the CTA fails', async () => {
		const error = {
			code: 'internal_server_error',
			message: 'CTA creation failed',
			data: { status: 500 },
		};

		fetchMock.postOnce( createCTAEndpoint, { body: error, status: 500 } );

		const { result } = renderHook( () => useCreateExpressSetupCTA(), {
			registry,
			features: [ 'rrmExpressSetup' ],
		} );

		const { error: createError } = await result.current( params );

		expect( createError ).toMatchObject( error );
		expect( fetchMock ).toHaveFetchedTimes( 1 );
		expect( fetchMock ).not.toHaveFetched( publicationEndpoint );
		expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
		expect( fetchMock ).not.toHaveFetched( settingsEndpoint );
		expect( console ).toHaveErrored();
	} );

	describe( 'ctaID', () => {
		it( 'should set the ctaID query argument from the created CTA name', async () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';
			mockSuccessfulRequests();

			const { result } = renderHook( () => useCreateExpressSetupCTA(), {
				registry,
				features: [ 'rrmExpressSetup' ],
			} );

			await act( async () => {
				await result.current( params );
			} );

			expect( global.location.href ).toContain( 'ctaID=1' );
		} );

		it( 'should not set the ctaID query argument when the response has no usable identifier', async () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';

			fetchMock.postOnce( createCTAEndpoint, {
				body: { type: CTA_TYPES.NEWSLETTER_SIGNUP },
				status: 200,
			} );
			fetchMock.getOnce( publicationEndpoint, {
				body: livePublication,
				status: 200,
			} );
			fetchMock.getOnce( ctasEndpoint, { body: [], status: 200 } );
			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body as string ).data,
				status: 200,
			} ) );

			const { result } = renderHook( () => useCreateExpressSetupCTA(), {
				registry,
				features: [ 'rrmExpressSetup' ],
			} );

			await act( async () => {
				await result.current( params );
			} );

			expect( global.location.href ).not.toContain( 'ctaID' );
		} );

		it( 'should not set the ctaID query argument when creating the CTA fails', async () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';

			fetchMock.postOnce( createCTAEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'CTA creation failed',
					data: { status: 500 },
				},
				status: 500,
			} );

			const { result } = renderHook( () => useCreateExpressSetupCTA(), {
				registry,
				features: [ 'rrmExpressSetup' ],
			} );

			await act( async () => {
				await result.current( params );
			} );

			expect( global.location.href ).not.toContain( 'ctaID' );
			expect( console ).toHaveErrored();
		} );
	} );
} );
