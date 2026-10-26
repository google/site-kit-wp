/**
 * StoreErrorNotices component tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import { mockBrowserScrolling } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	provideModules,
	render,
} from '@tests/js/test-utils';
import StoreErrorNotices from './StoreErrorNotices';

describe( 'StoreErrorNotices', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const error = {
		code: 'test-error-code',
		message: 'User does not have sufficient permissions for this property.',
		data: {
			reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
		},
	};

	beforeEach( async () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				name: 'Analytics',
				owner: { login: 'admin' },
			},
		] );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( error, 'getReport', [] );
	} );

	it( 'should render the insufficient permissions error with a title', () => {
		const { getByText, queryByText } = render(
			<StoreErrorNotices
				moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
				storeName={ MODULES_ANALYTICS_4 }
			/>,
			{ registry }
		);

		expect( getByText( 'Insufficient permissions' ) ).toBeInTheDocument();
		expect(
			getByText(
				'Your Google account does not have sufficient permissions for this Analytics property, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "admin", you can contact them for more information.'
			)
		).toBeInTheDocument();
		expect( queryByText( 'Error:' ) ).not.toBeInTheDocument();
		expect( queryByText( '(Please try again.)' ) ).not.toBeInTheDocument();
	} );

	describe( 'scrollIntoView', () => {
		mockBrowserScrolling();

		beforeEach( async () => {
			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setErrorForSelector(
					{ code: 'second-error', message: 'A second error.' },
					'getReports',
					[]
				);
		} );

		it( 'should scroll only the first error notice into view when `scrollIntoView` is set', () => {
			const { container } = render(
				<StoreErrorNotices
					moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
					storeName={ MODULES_ANALYTICS_4 }
					scrollIntoView
				/>,
				{ registry }
			);

			expect(
				container.querySelectorAll( '.googlesitekit-notice-container' )
			).toHaveLength( 2 );
			expect( Element.prototype.scrollIntoView ).toHaveBeenCalledTimes(
				1
			);
		} );

		it( 'should not scroll any notice into view by default', () => {
			render(
				<StoreErrorNotices
					moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
					storeName={ MODULES_ANALYTICS_4 }
				/>,
				{ registry }
			);

			expect( Element.prototype.scrollIntoView ).not.toHaveBeenCalled();
		} );
	} );
} );
