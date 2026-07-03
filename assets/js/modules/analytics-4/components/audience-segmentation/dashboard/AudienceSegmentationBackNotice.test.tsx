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
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import AudienceSegmentationBackNotice, {
	AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG,
} from './AudienceSegmentationBackNotice';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './AudienceSelectionPanel/constants';

describe( 'AudienceSegmentationBackNotice', () => {
	let registry: WPDataRegistry;

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAudienceSegmentationBackNotice'
	)( AudienceSegmentationBackNotice );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'should dismiss notice when clicking on Got it', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG ],
			status: 200,
		} );

		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
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
		} );
	} );

	it( 'should dismiss notice and open audience selection panel when clicking on Select groups', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG ],
			status: 200,
		} );

		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
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
		} );
	} );
} );
