/**
 * InternalServerError component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import {
	createTestRegistry,
	provideUserAuthentication,
} from '../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';

const INTERNAL_SERVER_ERROR_NOTIFICATION = 'internal-server-error';

describe( 'InternalServerError', () => {
	const registry = createTestRegistry();

	const notification =
		DEFAULT_NOTIFICATIONS[ INTERNAL_SERVER_ERROR_NOTIFICATION ];

	describe( 'checkRequirements', () => {
		beforeEach( () => {
			provideUserAuthentication( registry );

			registry.dispatch( CORE_SITE ).clearInternalServerError();
		} );

		it( 'is active', async () => {
			const error = {
				id: 'module-setup-error',
				title: 'Test Error',
				description: 'Error message',
			};

			registry.dispatch( CORE_SITE ).setInternalServerError( error );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when there is no internal server error', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );
} );
