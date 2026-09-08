/**
 * Reader Revenue Manager SetupMainExpress component tests.
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
import { Registry } from '@/js/googlesitekit-data';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	render,
} from '@tests/js/test-utils';
import SetupMainExpress from './index';

jest.mock( './PoweredBy', () => () => null );

describe( 'SetupMainExpress', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		providePublications( registry, [] );
	} );

	it( 'renders the newsletter CTA component for newsletter-signup CTA', () => {
		global.location.href =
			'http://example.com/?cta=newsletter-signup&step=setup-cta';

		const { getByText } = render( <SetupMainExpress />, { registry } );

		expect(
			getByText(
				'RRM express setup placeholder: newsletter CTA setup step.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the default express setup when no CTA is specified', () => {
		global.location.href = 'http://example.com/?step=connect-publication';

		const { getByText, queryByText, container } = render(
			<SetupMainExpress />,
			{ registry }
		);

		expect( getByText( /Let's get started/ ) ).toBeInTheDocument();
		expect(
			queryByText( 'Set up a sign-up form' )
		).not.toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 4 );
	} );

	it( 'renders the default express setup for an unknown CTA', () => {
		global.location.href =
			'http://example.com/?cta=unknown-cta&step=connect-publication';

		const { getByText, queryByText } = render( <SetupMainExpress />, {
			registry,
		} );

		expect( getByText( /Let's get started/ ) ).toBeInTheDocument();
		expect(
			queryByText( 'Set up a sign-up form' )
		).not.toBeInTheDocument();
	} );
} );
