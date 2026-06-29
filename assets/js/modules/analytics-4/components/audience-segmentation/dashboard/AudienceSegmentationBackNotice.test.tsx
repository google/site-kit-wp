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
	let dismissItemSpy: jest.SpyInstance;
	let setValueSpy: jest.SpyInstance;

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAudienceSegmentationBackNotice'
	)( AudienceSegmentationBackNotice );

	beforeEach( () => {
		registry = createTestRegistry();
		dismissItemSpy = jest
			.spyOn( registry.dispatch( CORE_USER ), 'dismissItem' )
			.mockImplementation( () => Promise.resolve() );
		setValueSpy = jest.spyOn( registry.dispatch( CORE_UI ), 'setValue' );
	} );

	afterEach( () => {
		dismissItemSpy.mockReset();
		setValueSpy.mockReset();
	} );

	it( 'should dismiss notice when clicking on Got it', () => {
		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /got it/i } ) );

		expect( dismissItemSpy ).toHaveBeenCalledWith(
			AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG
		);
		expect( setValueSpy ).not.toHaveBeenCalledWith(
			AUDIENCE_SELECTION_PANEL_OPENED_KEY,
			true
		);
	} );

	it( 'should dismiss notice and open audience selection panel when clicking on Select groups', async () => {
		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /select groups/i } ) );

		await waitFor( () => {
			expect( dismissItemSpy ).toHaveBeenCalledWith(
				AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG
			);
			expect( setValueSpy ).toHaveBeenCalledWith(
				AUDIENCE_SELECTION_PANEL_OPENED_KEY,
				true
			);
		} );
	} );
} );
