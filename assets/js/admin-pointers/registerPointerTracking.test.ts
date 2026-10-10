/**
 * `registerPointerTracking` tests.
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
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import registerPointerTracking from './registerPointerTracking';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const SLUG = 'test-pointer';
const CTA_URL =
	'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard';
const TRACKING = {
	view: { category: 'test-category', action: 'view_notification' },
	click: { category: 'test-category', action: 'confirm_notification' },
	dismiss: { category: 'test-category', action: 'dismiss_notification' },
};

describe( 'registerPointerTracking', () => {
	mockLocation();

	let handlers: ReturnType< typeof registerPointerTracking > | null;

	beforeEach( () => {
		mockTrackEvent.mockClear();
		document.body.innerHTML = `
			<div class="wp-pointer ${ SLUG }">
				<a class="googlesitekit-pointer-cta" href="${ CTA_URL }">Set up</a>
			</div>
		`;
	} );

	afterEach( () => {
		// Removes the click listener that registration adds to the document.
		handlers?.onDismiss?.();
		handlers = null;
		document.body.innerHTML = '';
	} );

	function clickCTA() {
		document
			.querySelector< HTMLAnchorElement >( '.googlesitekit-pointer-cta' )
			?.click();
	}

	it( 'sends the view event when tracking is registered', () => {
		handlers = registerPointerTracking( SLUG, TRACKING );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'test-category',
			'view_notification'
		);
	} );

	it( 'sends the click event, then opens the link', async () => {
		handlers = registerPointerTracking( SLUG, TRACKING );

		clickCTA();

		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			'test-category',
			'confirm_notification'
		);
		expect( global.location.assign ).not.toHaveBeenCalled();

		await Promise.resolve();
		await Promise.resolve();

		expect( global.location.assign ).toHaveBeenCalledWith( CTA_URL );
	} );

	it( 'sends no dismiss event when the pointer is dismissed after a click', () => {
		handlers = registerPointerTracking( SLUG, TRACKING );

		clickCTA();
		handlers.onDismiss?.();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
		expect( mockTrackEvent ).not.toHaveBeenCalledWith(
			'test-category',
			'dismiss_notification'
		);
	} );
} );
