/**
 * Reader Revenue Manager SetupMain component tests.
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

import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	freezeFetch,
	muteFetch,
	provideModules,
	render,
	waitForDefaultTimeouts,
} from '../../../../../../tests/js/test-utils';
import { publications } from '../../datastore/__fixtures__';
import SetupMain from './SetupMain';

describe( 'SetupMain', () => {
	let registry;

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);
	const rrmSettingsRegExp = new RegExp(
		'/reader-revenue-manager/data/settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {} );
	} );

	it( 'should render the loading state when publications are being loaded', () => {
		freezeFetch( publicationsEndpoint );

		const { getByRole } = render( <SetupMain />, { registry } );

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render the publication create state when no publications are available', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [] );

		const { getByText, waitForRegistry } = render( <SetupMain />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getByText(
				'To complete your Reader Revenue Manager account setup you will need to create a publication.'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the setup form when publications are available', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		const { getByText, waitForRegistry } = render( <SetupMain />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getByText(
				'Select your preferred publication to connect with Site Kit'
			)
		).toBeInTheDocument();
	} );

	it( 'should setup module when the CTA is clicked', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		const finishSetup = jest.fn();

		const { getByRole, waitForRegistry } = render(
			<SetupMain finishSetup={ finishSetup } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		muteFetch( rrmSettingsRegExp );

		act( () => {
			fireEvent.click(
				getByRole( 'button', { name: /Complete setup/i } )
			);
		} );

		await waitForRegistry();
		await act( waitForDefaultTimeouts );

		expect( fetchMock ).toHaveFetchedTimes( 1, rrmSettingsRegExp );

		expect( finishSetup ).toHaveBeenCalledTimes( 1 );
	} );
} );
