/**
 * Site Goals EventProviderDeactivatedNotice tests.
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { render } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import EventProviderDeactivatedNotice from './EventProviderDeactivatedNotice';

describe( 'EventProviderDeactivatedNotice', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders the online store title, text, and Learn more link when the store plugin is not active', () => {
		provideSiteInfo( registry, {
			activeConversionEventProviders: [ 'wpforms' ],
		} );

		const { getByRole, getByText } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.ECOMMERCE }
				providerSlug="woocommerce"
			/>,
			{ registry }
		);

		expect(
			getByText( 'Online store plugin no longer found' )
		).toBeInTheDocument();
		expect(
			getByText( /used to track your online store/ )
		).toBeInTheDocument();
		expect(
			getByRole( 'link', { name: /Learn more/ } )
		).toBeInTheDocument();
	} );

	it( 'renders the form title and text when the form plugin is not active', () => {
		provideSiteInfo( registry, {
			activeConversionEventProviders: [ 'woocommerce' ],
		} );

		const { getByText } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.LEAD }
				providerSlug="wpforms"
			/>,
			{ registry }
		);

		expect(
			getByText( 'Form plugin no longer found' )
		).toBeInTheDocument();
		expect( getByText( /used to track your forms/ ) ).toBeInTheDocument();
	} );

	it( 'renders the online store notice with no "Got it" button', () => {
		provideSiteInfo( registry, {
			activeConversionEventProviders: [],
		} );

		const { getByText, queryByText } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.ECOMMERCE }
				providerSlug="woocommerce"
			/>,
			{ registry }
		);

		expect(
			getByText( 'Online store plugin no longer found' )
		).toBeInTheDocument();
		expect( queryByText( 'Got it' ) ).not.toBeInTheDocument();
	} );

	it( "renders nothing when the active list still holds the tab's plugin slug", () => {
		provideSiteInfo( registry, {
			activeConversionEventProviders: [ 'woocommerce' ],
		} );

		const { container } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.ECOMMERCE }
				providerSlug="woocommerce"
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing while the active provider list is still undefined', () => {
		provideSiteInfo( registry );

		const { container } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.ECOMMERCE }
				providerSlug="woocommerce"
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when no providerSlug is passed', () => {
		provideSiteInfo( registry, {
			activeConversionEventProviders: [],
		} );

		const { container } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.ECOMMERCE }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing for a slug that neither label map holds', () => {
		provideSiteInfo( registry, {
			activeConversionEventProviders: [],
		} );

		const { container } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.ECOMMERCE }
				providerSlug="content-events"
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when a lead form slug arrives with the ecommerce goal type', () => {
		provideSiteInfo( registry, {
			activeConversionEventProviders: [],
		} );

		const { container } = render(
			<EventProviderDeactivatedNotice
				goalType={ GOAL_TYPES.ECOMMERCE }
				providerSlug="wpforms"
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
