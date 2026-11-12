/**
 * Reader Revenue Manager express setup module settings link tests.
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
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import ModuleSettingsLink from './ModuleSettingsLink';

const mockTrackEvent = jest.fn();

jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks/useExpressSetupTrackEvent',
	() => ( {
		__esModule: true,
		default: () => mockTrackEvent,
	} )
);

describe( 'ModuleSettingsLink', () => {
	mockLocation();

	let registry: WPDataRegistry;

	beforeEach( () => {
		mockTrackEvent.mockClear();

		registry = createTestRegistry();
		provideSiteInfo( registry );

		global.location.href =
			'http://example.com/?cta=newsletter-signup&step=existing-cta';
	} );

	it( 'links to the Reader Revenue Manager settings in the same tab', () => {
		const { getByRole } = render(
			<ModuleSettingsLink eventName="click_change_placement_settings_link">
				Site Kit settings
			</ModuleSettingsLink>,
			{ registry }
		);

		const link = getByRole( 'link', { name: 'Site Kit settings' } );

		expect( link ).toHaveAttribute(
			'href',
			expect.stringContaining(
				'#connected-services/reader-revenue-manager/edit'
			)
		);
		expect( link ).not.toHaveAttribute( 'target', '_blank' );
	} );

	it( 'tracks the given event with the current step as its label', () => {
		const { getByRole } = render(
			<ModuleSettingsLink eventName="click_change_placement_settings_link">
				Site Kit settings
			</ModuleSettingsLink>,
			{ registry }
		);

		const link = getByRole( 'link', { name: 'Site Kit settings' } );

		// jsdom can't navigate, so keep the click from trying to.
		link.addEventListener( 'click', ( event ) => event.preventDefault() );

		fireEvent.click( link );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'click_change_placement_settings_link',
			'existing-cta'
		);
	} );
} );
