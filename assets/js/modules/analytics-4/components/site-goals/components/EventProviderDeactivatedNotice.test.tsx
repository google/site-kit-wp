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

	it( 'renders the online store wording when the store plugin is no longer active', () => {
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

	it( 'renders the form wording when the form plugin is no longer active', () => {
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

	it( 'renders no "Got it" button, because the notice is not dismissible', () => {
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

	it( 'renders nothing when the provider plugin is still active', () => {
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

	it( 'renders nothing until the site info resolves', () => {
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

	it( 'renders nothing when the tab has no provider slug', () => {
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

	it( 'renders nothing for a provider slug that no Site Goals tab shows', () => {
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

	it( 'renders nothing when the slug belongs to the other goal type', () => {
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
