/**
 * `core/user` data store: feedback tests.
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

/**
 * Internal dependencies
 */
import { createTestRegistry } from '@tests/js/utils';
import { CORE_USER } from './constants';
import { Feedback } from './feedback';

describe( 'core/user feedback', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	const feedbackEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/feedback'
	);

	const feedback: Feedback = {
		namespace: 'feature_hub',
		group: 'feature_relevancy_analytics-4',
		key: 'vote',
		value: 'up',
	};

	describe( 'sendFeedback', () => {
		it( 'should send the feedback payload to the `core/user/data/feedback` route', async () => {
			fetchMock.postOnce( feedbackEndpoint, {
				body: { success: true },
			} );

			await registry.dispatch( CORE_USER ).sendFeedback( feedback );

			expect( fetchMock ).toHaveFetched( feedbackEndpoint, {
				body: {
					data: feedback,
				},
			} );
		} );

		it( 'should return the response on success', async () => {
			fetchMock.postOnce( feedbackEndpoint, {
				body: { success: true },
			} );

			const { response, error } = await registry
				.dispatch( CORE_USER )
				.sendFeedback( feedback );

			expect( response ).toEqual( { success: true } );
			expect( error ).toBeUndefined();
		} );

		it.each( [ [ 'namespace' ], [ 'group' ], [ 'key' ], [ 'value' ] ] )(
			'should throw an error when %s is missing',
			( field ) => {
				const invalidFeedback = { ...feedback };
				delete invalidFeedback[ field as keyof Feedback ];

				expect( () =>
					registry
						.dispatch( CORE_USER )
						.sendFeedback( invalidFeedback as Feedback )
				).toThrow( `${ field } is required and must be a string.` );
			}
		);

		it( 'should store the error when the request fails', async () => {
			fetchMock.postOnce( feedbackEndpoint, {
				body: {
					code: 'invalid_param',
					message: 'namespace is not a valid value.',
					data: { status: 400 },
				},
				status: 400,
			} );

			const { response, error } = await registry
				.dispatch( CORE_USER )
				.sendFeedback( feedback );

			expect( response ).toBeUndefined();
			expect( error ).toEqual( {
				code: 'invalid_param',
				message: 'namespace is not a valid value.',
				data: { status: 400 },
			} );
			expect(
				registry
					.select( CORE_USER )
					.getErrorForAction( 'sendFeedback', [ feedback ] )
			).toEqual( {
				code: 'invalid_param',
				message: 'namespace is not a valid value.',
				data: { status: 400 },
			} );
			expect( console ).toHaveErrored();
		} );

		it( 'should clear the stored error when the feedback is sent again successfully', async () => {
			fetchMock.postOnce( feedbackEndpoint, {
				body: {
					code: 'invalid_param',
					message: 'namespace is not a valid value.',
					data: { status: 400 },
				},
				status: 400,
			} );

			await registry.dispatch( CORE_USER ).sendFeedback( feedback );

			expect(
				registry
					.select( CORE_USER )
					.getErrorForAction( 'sendFeedback', [ feedback ] )
			).toBeDefined();
			expect( console ).toHaveErrored();

			fetchMock.postOnce( feedbackEndpoint, {
				body: { success: true },
			} );

			await registry.dispatch( CORE_USER ).sendFeedback( feedback );

			expect(
				registry
					.select( CORE_USER )
					.getErrorForAction( 'sendFeedback', [ feedback ] )
			).toBeUndefined();
		} );
	} );
} );
