/**
 * ConfirmDisableConversionTrackingDialog component tests.
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
import ConfirmDisableConversionTrackingDialog from './ConfirmDisableConversionTrackingDialog';

describe( 'ConfirmDisableConversionTrackingDialog', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should display appropriate subtitle', async () => {
		provideModules( registry, [
			{ slug: 'ads', active: true, connected: true },
		] );

		const { getByText, waitForRegistry } = render(
			<ConfirmDisableConversionTrackingDialog
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
				/By disabling enhanced conversion tracking, you will no longer have access to/i
			)
		).toBeInTheDocument();
	} );

	it( 'should display appropriate point items', async () => {
		provideModules( registry, [
			{ slug: 'ads', active: true, connected: true },
		] );

		const { getByText, waitForRegistry } = render(
			<ConfirmDisableConversionTrackingDialog
				onConfirm={ () => {} }
				onCancel={ () => {} }
			/>,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText( /Performance of your Ad campaigns/i )
		).toBeInTheDocument();
		expect(
			getByText(
				/Tracking additional conversion-related events via Analytics/i
			)
		).toBeInTheDocument();
	} );
} );
