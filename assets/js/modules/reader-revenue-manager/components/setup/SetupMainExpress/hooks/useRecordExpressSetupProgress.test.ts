/**
 * Reader Revenue Manager express setup `useRecordExpressSetupProgress` hook tests.
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
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
	waitFor,
	waitForDefaultTimeouts,
} from '@tests/js/test-utils';
import useCTAID from './useCTAID';
import useRecordExpressSetupProgress from './useRecordExpressSetupProgress';

describe( 'useRecordExpressSetupProgress', () => {
	mockLocation();

	const userSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/user-settings'
	);

	const ENTRY_KEY = `${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }:new`;

	// 2026-01-01 00:00:00.500 UTC, so flooring to seconds is observable.
	const NOW_IN_MS = 1767225600500;
	const NOW_IN_SECONDS = 1767225600;

	let registry: Registry;
	let dateNowSpy: jest.SpyInstance;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		dateNowSpy = jest.spyOn( Date, 'now' ).mockReturnValue( NOW_IN_MS );

		fetchMock.post( userSettingsEndpoint, {
			body: { lastActionedExpressSetups: {} },
			status: 200,
		} );
	} );

	afterEach( () => {
		dateNowSpy.mockRestore();
	} );

	it( 'should not save anything while the step is undefined', async () => {
		renderHook(
			() =>
				useRecordExpressSetupProgress(
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
					undefined
				),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( userSettingsEndpoint );
	} );

	it( 'should save the current time in seconds when a step begins', () => {
		renderHook(
			() =>
				useRecordExpressSetupProgress(
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
					EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
				),
			{ registry }
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, userSettingsEndpoint );
		expect( fetchMock ).toHaveFetched( userSettingsEndpoint, {
			body: {
				data: {
					lastActionedExpressSetups: {
						[ ENTRY_KEY ]: NOW_IN_SECONDS,
					},
				},
			},
		} );
	} );

	it( 'should save the current time each time the step changes', async () => {
		const { rerender } = renderHook(
			( { stepSlug }: { stepSlug: EXPRESS_SETUP_STEPS } ) =>
				useRecordExpressSetupProgress(
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
					stepSlug
				),
			{
				registry,
			}
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( userSettingsEndpoint );

		rerender( { stepSlug: EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION } );

		expect( fetchMock ).toHaveFetchedTimes( 1, userSettingsEndpoint );

		// Re-rendering on the same step does not save again.
		rerender( { stepSlug: EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION } );
		await waitForDefaultTimeouts();

		expect( fetchMock ).toHaveFetchedTimes( 1, userSettingsEndpoint );

		dateNowSpy.mockReturnValue( NOW_IN_MS + 60000 );

		rerender( { stepSlug: EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES } );

		expect( fetchMock ).toHaveFetchedTimes( 2, userSettingsEndpoint );

		expect( fetchMock ).toHaveLastFetched( userSettingsEndpoint, {
			body: {
				data: {
					lastActionedExpressSetups: {
						[ ENTRY_KEY ]: NOW_IN_SECONDS + 60,
					},
				},
			},
		} );
	} );

	it( 'should remove the entry when the setup complete step begins', () => {
		renderHook(
			() =>
				useRecordExpressSetupProgress(
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
					EXPRESS_SETUP_STEPS.SETUP_COMPLETE
				),
			{ registry }
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, userSettingsEndpoint );
		expect( fetchMock ).toHaveFetched( userSettingsEndpoint, {
			body: {
				data: {
					lastActionedExpressSetups: {
						[ ENTRY_KEY ]: null,
					},
				},
			},
		} );
	} );

	describe( 'completedExpressSetups', () => {
		const CTA_ID = 'a1b2c3';

		beforeEach( () => {
			global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }&ctaID=${ CTA_ID }`;
		} );

		it( 'should save the completed entry in the same request that removes the last actioned entry', () => {
			renderHook(
				() =>
					useRecordExpressSetupProgress(
						EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
						EXPRESS_SETUP_STEPS.SETUP_COMPLETE
					),
				{ registry }
			);

			expect( fetchMock ).toHaveFetchedTimes( 1, userSettingsEndpoint );
			expect( fetchMock ).toHaveFetched( userSettingsEndpoint, {
				body: {
					data: {
						lastActionedExpressSetups: { [ ENTRY_KEY ]: null },
						completedExpressSetups: {
							[ `${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }:${ CTA_ID }` ]:
								NOW_IN_SECONDS,
						},
					},
				},
			} );
		} );

		it( 'should not save a completed entry on steps before setup complete', () => {
			renderHook(
				() =>
					useRecordExpressSetupProgress(
						EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
						EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
					),
				{ registry }
			);

			expect( fetchMock ).toHaveFetched( userSettingsEndpoint, {
				body: {
					data: {
						lastActionedExpressSetups: {
							[ ENTRY_KEY ]: NOW_IN_SECONDS,
						},
					},
				},
			} );
		} );

		it( 'should not save a completed entry when there is no ctaID', () => {
			global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;

			renderHook(
				() =>
					useRecordExpressSetupProgress(
						EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
						EXPRESS_SETUP_STEPS.SETUP_COMPLETE
					),
				{ registry }
			);

			expect( fetchMock ).toHaveFetched( userSettingsEndpoint, {
				body: {
					data: {
						lastActionedExpressSetups: { [ ENTRY_KEY ]: null },
					},
				},
			} );
		} );

		it( 'should not save a completed entry when the cta is not supported', () => {
			global.location.href = `http://example.com/?cta=unsupported&ctaID=${ CTA_ID }`;

			renderHook(
				() =>
					useRecordExpressSetupProgress(
						'unsupported',
						EXPRESS_SETUP_STEPS.SETUP_COMPLETE
					),
				{ registry }
			);

			expect( fetchMock ).toHaveFetched( userSettingsEndpoint, {
				body: {
					data: {
						lastActionedExpressSetups: { 'unsupported:new': null },
					},
				},
			} );
		} );

		it( 'should not save again when the ctaID is set while on an earlier step', async () => {
			global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;

			const { result } = renderHook(
				() => ( {
					ctaIDState: useCTAID(),
					progress: useRecordExpressSetupProgress(
						EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
						EXPRESS_SETUP_STEPS.NEWSLETTER_SIGNUP_FORM
					),
				} ),
				{ registry }
			);

			expect( fetchMock ).toHaveFetchedTimes( 1, userSettingsEndpoint );

			act( () => {
				result.current.ctaIDState[ 1 ]( CTA_ID );
			} );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 1, userSettingsEndpoint );
		} );
	} );

	it( 'should clear a save error rather than keeping it in the store', async () => {
		fetchMock.reset();
		fetchMock.post( userSettingsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		renderHook(
			() =>
				useRecordExpressSetupProgress(
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
					EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
				),
			{ registry }
		);

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( userSettingsEndpoint );
		} );

		expect( console ).toHaveErroredWith(
			'Google Site Kit API Error',
			'method:POST',
			'datapoint:user-settings',
			'type:modules',
			'identifier:reader-revenue-manager',
			'error:"Internal server error"'
		);

		expect(
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getErrorForAction( 'saveUserSettings', [] )
		).not.toBeDefined();
	} );
} );
