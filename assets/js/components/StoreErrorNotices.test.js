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
import {
	createTestRegistry,
	provideModules,
	render,
} from '@tests/js/test-utils';
import StoreErrorNotices from './StoreErrorNotices';

describe( 'StoreErrorNotices', () => {
	let registry;

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

	it( 'should render the legacy insufficient permissions error design when the feature flag is disabled', () => {
		const { getByText, queryByText } = render(
			<StoreErrorNotices
				moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
				storeName={ MODULES_ANALYTICS_4 }
			/>,
			{ registry }
		);
		expect(
			queryByText( 'Insufficient permissions' )
		).not.toBeInTheDocument();
		expect(
			getByText(
				'Error: Your Google account does not have sufficient permissions for this Analytics property, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "admin" — you can contact them for more information. (Please try again.)'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the new insufficient permissions error design when the feature flag is enabled', () => {
		const { getByText, queryByText } = render(
			<StoreErrorNotices
				moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
				storeName={ MODULES_ANALYTICS_4 }
			/>,
			{
				features: [ 'setupFlowRefreshPhase4' ],
				registry,
			}
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
} );
