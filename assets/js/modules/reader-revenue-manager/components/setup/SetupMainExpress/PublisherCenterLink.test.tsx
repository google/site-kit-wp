/**
 * Reader Revenue Manager express setup Publisher Center link tests.
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
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { decodeServiceURL } from '@tests/js/mock-accountChooserURL-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideUserInfo,
	render,
} from '@tests/js/test-utils';
import PublisherCenterLink from './PublisherCenterLink';

const mockTrackEvent = jest.fn();

jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks/useExpressSetupTrackEvent',
	() => ( {
		__esModule: true,
		default: () => mockTrackEvent,
	} )
);

describe( 'PublisherCenterLink', () => {
	mockLocation();

	let registry: WPDataRegistry;

	beforeEach( () => {
		mockTrackEvent.mockClear();

		registry = createTestRegistry();
		provideUserInfo( registry );
		providePublication( registry, publications[ 0 ] );

		global.location.href =
			'http://example.com/?cta=newsletter-signup&step=existing-cta';
	} );

	it( 'links to the Publisher Center in a new tab', () => {
		const { getByRole } = render(
			<PublisherCenterLink eventName="click_view_publications_link">
				Publisher Center
			</PublisherCenterLink>,
			{ registry }
		);

		const link = getByRole( 'link', { name: /Publisher Center/ } );

		expect(
			decodeServiceURL( link.getAttribute( 'href' ) as string )
		).toContain( 'reader-revenue-manager/content-access/overview' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'tracks the given event with the current step as its label', () => {
		const { getByRole } = render(
			<PublisherCenterLink eventName="click_view_publications_link">
				Publisher Center
			</PublisherCenterLink>,
			{ registry }
		);

		const link = getByRole( 'link', { name: /Publisher Center/ } );

		// jsdom can't navigate, so keep the click from trying to.
		link.addEventListener( 'click', ( event ) => event.preventDefault() );

		fireEvent.click( link );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'click_view_publications_link',
			'existing-cta'
		);
	} );
} );
