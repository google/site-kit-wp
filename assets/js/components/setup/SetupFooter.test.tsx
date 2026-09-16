/**
 * Module setup SetupFooter component tests.
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
import Modules from 'googlesitekit-modules';
import { type Registry } from '@/js/googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import SetupFooter from './SetupFooter';
import type { OnCompleteSetupCallback } from './types';

describe( 'SetupFooter', () => {
	mockLocation();

	const slug = 'test-module';
	const storeName = `test/${ slug }`;
	const finishSetup = jest.fn();
	const onCancel = jest.fn();

	function registerTestModule( {
		onCompleteSetup,
	}: {
		onCompleteSetup?: OnCompleteSetupCallback;
	} = {} ) {
		const registry = createTestRegistry() as Registry;

		registry.registerStore(
			storeName,
			// @ts-expect-error - `googlesitekit-modules` is not typed yet.
			Modules.createModuleStore( slug, {
				storeName,
			} )
		);

		registry.dispatch( CORE_MODULES ).registerModule( slug, {
			storeName,
			onCompleteSetup,
		} );

		provideModules( registry );
		provideSiteInfo( registry );

		return registry;
	}

	beforeEach( () => {
		finishSetup.mockClear();
		onCancel.mockClear();
	} );

	it( 'should omit the complete action when onCompleteSetup is not registered', () => {
		const registry = registerTestModule();

		const { queryByRole } = render(
			<SetupFooter
				moduleSlug={ slug }
				finishSetup={ finishSetup }
				onCancel={ onCancel }
			/>,
			{ registry }
		);

		expect(
			queryByRole( 'button', { name: 'Complete Setup' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the complete action when onCompleteSetup is registered', () => {
		const registry = registerTestModule( {
			onCompleteSetup: jest.fn(),
		} );

		const { getByRole } = render(
			<SetupFooter
				moduleSlug={ slug }
				finishSetup={ finishSetup }
				onCancel={ onCancel }
			/>,
			{ registry }
		);

		expect(
			getByRole( 'button', { name: 'Complete Setup' } )
		).toBeInTheDocument();
	} );

	it( 'should invoke onCompleteSetup with registry and finishSetup', async () => {
		const onCompleteSetup = jest.fn().mockResolvedValue( undefined );
		const registry = registerTestModule( { onCompleteSetup } );

		const { getByRole } = render(
			<SetupFooter
				moduleSlug={ slug }
				finishSetup={ finishSetup }
				onCancel={ onCancel }
			/>,
			{ registry }
		);

		await act( async () => {
			fireEvent.click(
				getByRole( 'button', { name: 'Complete Setup' } )
			);
			await Promise.resolve();
		} );

		await waitFor( () => expect( onCompleteSetup ).toHaveBeenCalled() );

		expect( onCompleteSetup ).toHaveBeenCalledWith( registry, finishSetup );
	} );
} );
