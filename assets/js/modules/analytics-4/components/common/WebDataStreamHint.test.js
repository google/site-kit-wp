/**
 * WebDataStreamHint component tests.
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
import {
	render,
	createTestRegistry,
	provideSiteInfo,
	fireEvent,
	waitFor,
	within,
} from '../../../../../../tests/js/test-utils';
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import WebDataStreamHint from './WebDataStreamHint';
import * as tracking from '@/js/util/tracking';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'WebDataStreamHint', () => {
	mockLocation();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true';
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	async function openTooltipAndClickLearnMore( container ) {
		const stepHintInfoTooltip = container.querySelector(
			'.googlesitekit-setup__step-hint .googlesitekit-info-tooltip'
		);

		expect( stepHintInfoTooltip ).toBeInTheDocument();

		fireEvent.mouseOver( stepHintInfoTooltip );

		await waitFor( () => {
			expect(
				document.querySelector(
					'.googlesitekit-setup__step-hint-tooltip'
				)
			).toBeInTheDocument();
		} );

		const tooltipContent = document.querySelector(
			'.googlesitekit-setup__step-hint-tooltip'
		);

		fireEvent.click(
			within( tooltipContent ).getByRole( 'link', {
				name: /Learn more/i,
			} )
		);
	}

	it( 'should track `click_learn_more_link` when the tooltip "Learn more" link is clicked', async () => {
		const { container, waitForRegistry } = render( <WebDataStreamHint />, {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		await openTooltipAndClickLearnMore( container );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			VIEW_CONTEXT_MODULE_SETUP,
			'click_learn_more_link',
			'analytics_data_stream'
		);
	} );

	describe( 'during initial setup flow', () => {
		beforeEach( () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&showProgress=true';
		} );

		it( 'should track `click_learn_more_link` with the `_setup` event category', async () => {
			const { container, waitForRegistry } = render(
				<WebDataStreamHint />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MODULE_SETUP,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			await openTooltipAndClickLearnMore( container );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
				'click_learn_more_link',
				'analytics_data_stream'
			);
		} );
	} );
} );
