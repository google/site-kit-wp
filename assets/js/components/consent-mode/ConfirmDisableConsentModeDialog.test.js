/**
 * ConfirmDisableConsentModeDialog component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	provideModules,
	render,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import ConfirmDisableConsentModeDialog from './ConfirmDisableConsentModeDialog';

describe( 'ConfirmDisableConsentModeDialog', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
	} );

	it( 'should display appropriate subtitle with Ads not connected', async () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetAdsMeasurementStatus(
				{ connected: false },
				{ useCache: false }
			);

		const { getByText, waitForRegistry } = render(
			<ConfirmDisableConsentModeDialog
				onConfirm={ () => {} }
				onCancel={ () => {} }
			/>,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText(
				/Disabling consent mode may affect your ability in the European Economic Area, the UK and Switzerland to:/i
			)
		).toBeInTheDocument();
	} );

	it( 'should display appropriate subtitle with Ads connected', async () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetAdsMeasurementStatus(
				{ connected: true },
				{ useCache: true }
			);

		const { getByText, waitForRegistry } = render(
			<ConfirmDisableConsentModeDialog
				onConfirm={ () => {} }
				onCancel={ () => {} }
			/>,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText(
				/Disabling consent mode may affect your ability to track these in the European Economic Area, the UK and Switzerland:/i
			)
		).toBeInTheDocument();
	} );
} );
