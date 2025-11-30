/**
 * ExitSetup component tests.
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
import {
	render,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	waitFor,
} from '../../../../tests/js/test-utils';
import * as tracking from '@/js/util/tracking';
import ExitSetup from './ExitSetup';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'ExitSetup', () => {
	mockLocation();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'should render correctly', () => {
		const { container } = render( <ExitSetup />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect( container.querySelector( 'button' ) ).toBeInTheDocument();
	} );

	it( 'should navigate to the plugins page when the user clicks the button', async () => {
		const { getByRole } = render(
			<ExitSetup
				gaTrackingEventArgs={ {
					category: 'test-category',
					label: 'test-label',
				} }
			/>,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'button' ) );

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalled();
		} );

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/plugins.php'
		);
	} );

	it( 'should track an event when the user clicks the button', () => {
		const { getByRole } = render(
			<ExitSetup
				gaTrackingEventArgs={ {
					category: 'test-category',
					label: 'test-label',
				} }
			/>,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'button' ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'test-category',
			'setup_flow_v3_exit_setup',
			'test-label'
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );
} );
