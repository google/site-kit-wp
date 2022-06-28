/**
 * Prototype Form component tests.
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
import SetupForm from './SetupForm';
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';

describe( 'SetupForm', () => {
	let registry;

	const defaultSettings = {
		publicationID: '',
		products: [],
		revenueModel: '',
	};

	const validSettings = {
		publicationID: 'example.com',
		colorTheme: 'light',
		buttonPlacement: 'bottom-right',
		buttonPostTypes: [ 'post' ],
	};

	beforeEach( () => {
		registry = createTestRegistry();
		// Prevent extra fetches during tests.
		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.setSettings( defaultSettings );

		// Mock `fetch` method.
		const pendingPromise = new Promise( () => {} );
		self.fetch = jest.fn().mockReturnValue( pendingPromise );
	} );

	describe( '"Configure Thank with Google" button', () => {
		it( 'is enabled by valid settings', () => {
			registry
				.dispatch( MODULES_THANK_WITH_GOOGLE )
				.setSettings( validSettings );
			const finishSetupButton = render(
				<SetupForm finishSetup={ jest.fn() } />,
				{ registry }
			).getByRole( 'button', {
				name: /Configure Thank with Google/i,
			} );
			expect( finishSetupButton ).toBeEnabled();
		} );

		it( 'is disabled by invalid settings', () => {
			const finishSetupButton = render(
				<SetupForm finishSetup={ jest.fn() } />,
				{ registry }
			).getByRole( 'button', {
				name: /Configure Thank with Google/i,
			} );
			expect( finishSetupButton ).toBeDisabled();
		} );

		it( 'submits form', () => {
			// Render enabled button.
			registry
				.dispatch( MODULES_THANK_WITH_GOOGLE )
				.setSettings( validSettings );
			const finishSetup = jest.fn();
			const finishSetupButton = render(
				<SetupForm finishSetup={ finishSetup } />,
				{ registry }
			).getByRole( 'button', {
				name: /Configure Thank with Google/i,
			} );

			// Click button.
			fireEvent.click( finishSetupButton );

			expect( finishSetup ).toHaveBeenCalled();
			expect( self.fetch ).toHaveBeenCalled();
		} );
	} );
} );
