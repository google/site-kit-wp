/**
 * SettingsCardEmailReporting component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { render } from '../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideUserAuthentication,
	freezeFetch,
} from '../../../../tests/js/utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import SettingsCardEmailReporting from './SettingsCardEmailReporting';

describe( 'SettingsCardEmailReporting', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
	} );

	it( 'should render the layout with correct title', async () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );

		const { getByText, waitForRegistry } = render(
			<SettingsCardEmailReporting />,
			{
				registry,
			}
		);

		expect( getByText( 'Email reports' ) ).toBeInTheDocument();

		await waitForRegistry();
	} );

	it( 'should show preview block while loading', async () => {
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/email-reporting' )
		);

		const { container, waitForRegistry } = render(
			<SettingsCardEmailReporting />,
			{
				registry,
			}
		);

		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();

		await waitForRegistry();
	} );

	it( 'should render SettingsEmailReporting component when loaded', async () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );

		const { getByText, waitForRegistry } = render(
			<SettingsCardEmailReporting />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( getByText( 'Enable email reports' ) ).toBeInTheDocument();
	} );
} );
