/**
 * AudienceSegmentationBackNotice component tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import * as tracking from '@/js/util/tracking';
import { mockIntersectionObserver } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import AudienceSegmentationBackNotice, {
	AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG,
} from './AudienceSegmentationBackNotice';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './AudienceSelectionPanel/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceSegmentationBackNotice', () => {
	const { simulateAllIntersections } = mockIntersectionObserver();
	let registry: WPDataRegistry;

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const viewContext = VIEW_CONTEXT_MAIN_DASHBOARD;

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAudienceSegmentationBackNotice'
	)( AudienceSegmentationBackNotice );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should dismiss notice when clicking on Got it', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG ],
			status: 200,
		} );

		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
			viewContext,
		} );

		fireEvent.click( getByRole( 'button', { name: /got it/i } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG,
						expiration: 0,
					},
				},
			} );

			expect(
				registry
					.select( CORE_USER )
					.isItemDismissed( AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG )
			).toBe( true );

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).not.toBe( true );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ viewContext }_audiences-reshown`,
				'dismiss_notice'
			);
		} );
	} );

	it( 'should dismiss notice and open audience selection panel when clicking on Select groups', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG ],
			status: 200,
		} );

		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
			viewContext,
		} );

		fireEvent.click( getByRole( 'button', { name: /select groups/i } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG,
						expiration: 0,
					},
				},
			} );

			expect(
				registry
					.select( CORE_USER )
					.isItemDismissed( AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG )
			).toBe( true );

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ viewContext }_audiences-reshown`,
				'confirm_notice'
			);
			expect( mockTrackEvent ).not.toHaveBeenCalledWith(
				`${ viewContext }_audiences-reshown`,
				'dismiss_notice'
			);
		} );
	} );

	it( 'should track the view_notice event when the notice is viewed', async () => {
		render( <WidgetWithComponentProps />, {
			registry,
			viewContext,
		} );

		expect( mockTrackEvent ).not.toHaveBeenCalled();

		// Simulate the notice coming into view.
		act( () => {
			simulateAllIntersections();
		} );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ viewContext }_audiences-reshown`,
				'view_notice'
			);
		} );
	} );
} );
