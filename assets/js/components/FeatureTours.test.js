/**
 * Feature Tours component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../tests/js/utils';
import { fireEvent, render } from '../../../tests/js/test-utils';
import FeatureTours from './FeatureTours';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';

describe( 'FeatureTours', () => {
	let registry;
	let observeMock;
	let disconnectMock;
	const dashboardElementID = 'js-googlesitekit-main-dashboard';

	function TourTooltipsWithMockUI() {
		return (
			<div>
				<div id={ dashboardElementID }>
					<div className="test-tour-step-1-target" />
				</div>
				<FeatureTours />
			</div>
		);
	}

	const testTour = {
		slug: 'test-tour',
		version: '2.0.0',
		contexts: [ 'common-context' ],
		gaEventCategory: '',
		steps: [
			{
				title: 'Test Tour - Step 1 Title',
				content: 'Test Tour - Step 1 Content',
				target: '.test-tour-step-1-target',
			},
		],
	};

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideSiteInfo( registry );
		provideModules( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
		registry.dispatch( CORE_USER ).receiveCurrentTour( testTour );

		observeMock = jest.fn();
		disconnectMock = jest.fn();

		global.ResizeObserver = jest.fn( function () {
			this.observe = observeMock;
			this.disconnect = disconnectMock;
		} );
	} );

	it( 'properly shows the current tour', async () => {
		const { getByRole, waitForRegistry } = render(
			<TourTooltipsWithMockUI />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( await getByRole( 'alertdialog' ) ).toBeInTheDocument();
		expect(
			getByRole( 'heading', { name: /test tour - step 1 title/i } )
		).toBeInTheDocument();
	} );

	it( 'dispatches resize event on dashboard element resize', async () => {
		const { container, waitForRegistry } = render(
			<TourTooltipsWithMockUI />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( observeMock ).toHaveBeenCalledWith(
			container.querySelector( `#${ dashboardElementID }` )
		);
	} );

	it( 'cleans up ResizeObserver on unmount', async () => {
		const fetchDismissTourRegExp = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-tour'
		);

		muteFetch( fetchDismissTourRegExp, [] );

		const { getByRole, waitForRegistry } = render(
			<TourTooltipsWithMockUI />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Dismiss the tour to test unmount cleanup on FeatureTours component.
		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( disconnectMock ).toHaveBeenCalled();
	} );
} );
