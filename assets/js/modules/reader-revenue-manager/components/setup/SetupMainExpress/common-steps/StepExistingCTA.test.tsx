/**
 * Reader Revenue Manager express setup existing CTA step tests.
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
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { decodeServiceURL } from '@tests/js/mock-accountChooserURL-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import StepExistingCTA, { existingCTAStep } from './StepExistingCTA';

const mockTrackEvent = jest.fn();

jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks/useExpressSetupTrackEvent',
	() => ( {
		__esModule: true,
		default: () => mockTrackEvent,
	} )
);

// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
const PUBLICATION_ID = publications[ 0 ].publicationId;

describe( 'StepExistingCTA', () => {
	mockLocation();

	let registry: WPDataRegistry;
	let onComplete: jest.Mock;

	const dashboardURL =
		'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard';

	const props = {
		title: 'We found an existing newsletter sign-up form for this publication',
		description:
			'Your publication is now connected to Site Kit. However, Site Kit can’t create a newsletter sign-up form for a publication that already has one in Reader Revenue Manager. To view or edit your publications, go to <a>Publisher Center</a>',
		targetingDescription:
			'To change who sees your newsletter sign-up form, set targeting rules in <a>Publisher Center</a>',
	};

	beforeEach( () => {
		mockTrackEvent.mockClear();

		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserInfo( registry );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { publicationID: PUBLICATION_ID } );
		providePublication( registry, publications[ 0 ] );

		onComplete = jest.fn();

		global.location.href = 'http://example.com/?cta=newsletter-signup';
	} );

	it( 'defines a step with the existing CTA slug', () => {
		expect( existingCTAStep.slug ).toBe( 'existing-cta' );
		expect( existingCTAStep.label ).toBe( 'CTA already exists' );
	} );

	it( 'renders the flow-specific copy', () => {
		const { getByText } = render(
			<StepExistingCTA { ...props } onComplete={ onComplete } />,
			{ registry }
		);

		expect( getByText( props.title ) ).toBeInTheDocument();
		expect( getByText( 'Placement' ) ).toBeInTheDocument();
		expect( getByText( 'Targeting' ) ).toBeInTheDocument();
		expect(
			getByText(
				/To change who sees your newsletter sign-up form, set targeting rules in/
			)
		).toBeInTheDocument();
	} );

	it( 'links both Publisher Center links in a new tab and the settings link in the same tab', () => {
		const { getAllByRole, getByRole } = render(
			<StepExistingCTA { ...props } onComplete={ onComplete } />,
			{ registry }
		);

		const publisherCenterLinks = getAllByRole( 'link', {
			name: /Publisher Center/,
		} );

		expect( publisherCenterLinks ).toHaveLength( 2 );

		publisherCenterLinks.forEach( ( link ) => {
			expect(
				decodeServiceURL( link.getAttribute( 'href' ) as string )
			).toContain( 'reader-revenue-manager/content-access/overview' );
			expect( link ).toHaveAttribute( 'target', '_blank' );
		} );

		const settingsLink = getByRole( 'link', { name: 'Site Kit settings' } );

		expect( settingsLink ).toHaveAttribute(
			'href',
			expect.stringContaining(
				'#connected-services/reader-revenue-manager/edit'
			)
		);
		expect( settingsLink ).not.toHaveAttribute( 'target', '_blank' );
	} );

	it( 'tracks each link click with the existing CTA label', () => {
		const { getAllByRole, getByRole } = render(
			<StepExistingCTA { ...props } onComplete={ onComplete } />,
			{ registry }
		);

		const [ descriptionLink, targetingLink ] = getAllByRole( 'link', {
			name: /Publisher Center/,
		} );
		const settingsLink = getByRole( 'link', { name: 'Site Kit settings' } );

		// jsdom can't navigate, so keep the link clicks from trying to.
		[ descriptionLink, targetingLink, settingsLink ].forEach( ( link ) =>
			link.addEventListener( 'click', ( event ) =>
				event.preventDefault()
			)
		);

		fireEvent.click( descriptionLink );
		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			'click_view_publications_link',
			'existing-cta'
		);

		fireEvent.click( settingsLink );
		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			'click_change_placement_settings_link',
			'existing-cta'
		);

		fireEvent.click( targetingLink );
		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			'click_set_targeting_rules_link',
			'existing-cta'
		);
	} );

	it( 'completes the step before returning to the dashboard', async () => {
		const { getByRole } = render(
			<StepExistingCTA { ...props } onComplete={ onComplete } />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Return to Dashboard' } )
		);

		expect( onComplete ).toHaveBeenCalledTimes( 1 );

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalledWith(
				dashboardURL
			);
		} );
	} );
} );
