/**
 * AllServicesTab component tests.
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
import {
	audienceFeature,
	monetizationFeature,
	multiGoalFeature,
	oldFeature,
	oneFeaturePerCategory,
	prerequisiteFeature,
	productivityFeature,
	secondAudienceFeature,
	setupModuleFeature,
} from '@/js/components/feature-discovery/__fixtures__/all-services';
import { ALL_SERVICES_TAB_PATH } from '@/js/components/feature-discovery/constants';
import { Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import type { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureDismissalKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { FEATURE_DISCOVERY_SETUP_SUCCESS_ALL_SERVICES_NOTIFICATION } from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import AllServicesTab from './AllServicesTab';

const AUDIENCE_HEADING = 'Get to know your audience';
const ENGAGEMENT_HEADING = 'Engage your visitors';
const MONETIZATION_HEADING = 'Earn money from your content';
const PRODUCTIVITY_HEADING = 'Collaborate and save time';

// The full curated order, as the acceptance criteria give it.
const ALL_HEADINGS = [
	AUDIENCE_HEADING,
	ENGAGEMENT_HEADING,
	MONETIZATION_HEADING,
	'Drive traffic to your site',
	'Manage privacy',
	'Improve your site speed and experience',
	PRODUCTIVITY_HEADING,
];

describe( 'AllServicesTab', () => {
	let registry: Registry;

	function provideAnalytics( connected: boolean ) {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: connected, connected },
		] );
	}

	function getHeadings( container: Element ) {
		return Array.from( container.querySelectorAll( 'h2' ) ).map(
			( heading ) => heading.textContent
		);
	}

	function getCardTitles( container: Element ) {
		return Array.from(
			container.querySelectorAll( '.googlesitekit-feature-card__heading' )
		).map( ( heading ) => heading.textContent );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );
	} );

	it( 'should render goal headings in the curated order', async () => {
		provideFeatures( registry, [
			productivityFeature,
			monetizationFeature,
			audienceFeature,
		] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		expect( getHeadings( container ) ).toEqual( [
			AUDIENCE_HEADING,
			MONETIZATION_HEADING,
			PRODUCTIVITY_HEADING,
		] );
	} );

	it( 'should render every goal heading in the curated order', async () => {
		provideFeatures( registry, oneFeaturePerCategory );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		expect( getHeadings( container ) ).toEqual( ALL_HEADINGS );
	} );

	it( 'should list features however long ago they were released, including one that is still new', async () => {
		provideFeatures( registry, [ oldFeature, audienceFeature ] );

		// The second feature is new enough to be listed in What's new?, the
		// first is not.
		expect(
			registry
				.select( CORE_FEATURE_DISCOVERY )
				.getWhatsNewFeatures()
				.map( ( { slug }: Feature ) => slug )
		).toEqual( [ 'audience-feature' ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		// Both are listed here all the same.
		expect( getCardTitles( container ) ).toEqual( [
			'Old feature',
			'Audience feature',
		] );
	} );

	it( 'should not render a heading for a goal with nothing to list', async () => {
		provideFeatures( registry, [ audienceFeature ] );

		const { container, queryByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		expect( getHeadings( container ) ).toEqual( [ AUDIENCE_HEADING ] );

		expect(
			queryByRole( 'heading', { name: MONETIZATION_HEADING } )
		).not.toBeInTheDocument();
	} );

	it( 'should list a feature serving several goals once, under its primary goal', async () => {
		provideFeatures( registry, [ audienceFeature, multiGoalFeature ] );

		const { container, getAllByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		expect(
			getAllByRole( 'heading', { name: 'Multi goal feature' } )
		).toHaveLength( 1 );

		const [ , engagementGroup ] = Array.from(
			container.querySelectorAll( '.googlesitekit-feature-goal-group' )
		);

		expect( engagementGroup ).toHaveTextContent( ENGAGEMENT_HEADING );
		expect( engagementGroup ).toHaveTextContent( 'Multi goal feature' );
	} );

	it( 'should place a feature under a selected secondary goal when filtered', async () => {
		provideFeatures( registry, [ multiGoalFeature ] );

		const { getByText, queryByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		fireEvent.click( getByText( 'Know your audience' ) );

		expect(
			queryByRole( 'heading', { name: ENGAGEMENT_HEADING } )
		).not.toBeInTheDocument();

		const audienceGroupHeading = queryByRole( 'heading', {
			name: AUDIENCE_HEADING,
		} );
		expect( audienceGroupHeading ).toBeInTheDocument();
		expect(
			audienceGroupHeading?.closest( '.googlesitekit-feature-goal-group' )
		).toHaveTextContent( 'Multi goal feature' );
	} );

	it( 'should render a feature once under the first selected goal in its own goal order', async () => {
		provideFeatures( registry, [ multiGoalFeature ] );

		const { container, getAllByRole, getByText, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		fireEvent.click( getByText( 'Know your audience' ) );
		fireEvent.click( getByText( 'Engage your visitors' ) );

		expect(
			getAllByRole( 'heading', { name: 'Multi goal feature' } )
		).toHaveLength( 1 );

		const [ firstGroup ] = Array.from(
			container.querySelectorAll( '.googlesitekit-feature-goal-group' )
		);

		expect( firstGroup ).toHaveTextContent( ENGAGEMENT_HEADING );
		expect( firstGroup ).toHaveTextContent( 'Multi goal feature' );
	} );

	it( 'should only render selected goal headings with features, in curated order', async () => {
		provideFeatures( registry, [
			audienceFeature,
			monetizationFeature,
			productivityFeature,
		] );

		const { container, getByText, queryByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		fireEvent.click( getByText( 'Collaborate' ) );
		fireEvent.click( getByText( 'Know your audience' ) );

		expect( getHeadings( container ) ).toEqual( [
			AUDIENCE_HEADING,
			PRODUCTIVITY_HEADING,
		] );

		expect(
			queryByRole( 'heading', { name: MONETIZATION_HEADING } )
		).not.toBeInTheDocument();
	} );

	it( 'should restore All services view when the last selected category is deselected', async () => {
		provideFeatures( registry, oneFeaturePerCategory );

		const { container, getByText, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		fireEvent.click( getByText( 'Know your audience' ) );
		expect( getHeadings( container ) ).toEqual( [ AUDIENCE_HEADING ] );

		fireEvent.click( getByText( 'Know your audience' ) );
		expect( getHeadings( container ) ).toEqual( ALL_HEADINGS );
	} );

	it( 'should clear selected categories when clicking All services', async () => {
		provideFeatures( registry, oneFeaturePerCategory );

		const { container, getByText, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		fireEvent.click( getByText( 'Know your audience' ) );
		fireEvent.click( getByText( 'Monetize' ) );
		expect( getHeadings( container ) ).toEqual( [
			AUDIENCE_HEADING,
			MONETIZATION_HEADING,
		] );

		fireEvent.click( getByText( 'All services' ) );
		expect( getHeadings( container ) ).toEqual( ALL_HEADINGS );
	} );

	it( 'should keep catalog registration order within a group', async () => {
		provideFeatures( registry, [ secondAudienceFeature, audienceFeature ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [
			'Second audience feature',
			'Audience feature',
		] );
	} );

	it( 'should still list a feature dismissed in What’s new?', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				getFeatureDismissalKey( 'audience-feature' ),
			] );

		provideFeatures( registry, [ audienceFeature ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [ 'Audience feature' ] );
	} );

	it( 'should not list a feature that is already set up', async () => {
		provideAnalytics( true );
		provideFeatures( registry, [ audienceFeature, setupModuleFeature ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [ 'Audience feature' ] );
	} );

	it( 'should not list a feature whose prerequisite module is not connected', async () => {
		provideAnalytics( false );
		provideFeatures( registry, [ audienceFeature, prerequisiteFeature ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [ 'Audience feature' ] );
	} );

	it( 'should list a feature once its prerequisite module is connected', async () => {
		provideAnalytics( true );
		provideFeatures( registry, [ audienceFeature, prerequisiteFeature ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [
			'Audience feature',
			'Prerequisite feature',
		] );
	} );

	it( 'should not render a dismiss control on any card', async () => {
		provideFeatures( registry, [ audienceFeature, monetizationFeature ] );

		const { container, queryByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await waitForRegistry();

		expect( getCardTitles( container ) ).toHaveLength( 2 );

		expect(
			queryByRole( 'button', { name: /^Dismiss/ } )
		).not.toBeInTheDocument();
	} );

	describe( 'setup success notice', () => {
		const SUCCESS_TITLE = 'Success! Set up feature is set up';

		beforeEach( () => {
			provideSiteInfo( registry );
			provideModules( registry );

			provideFeatures( registry, [
				audienceFeature,
				{
					slug: 'set-up-feature',
					title: 'Set up feature',
					setup: {
						...audienceFeature.setup,
						isEnabled: () => true,
					},
					successNotice: { title: SUCCESS_TITLE },
				} as Partial< Feature >,
			] );

			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification(
					FEATURE_DISCOVERY_SETUP_SUCCESS_ALL_SERVICES_NOTIFICATION,
					DEFAULT_NOTIFICATIONS[
						FEATURE_DISCOVERY_SETUP_SUCCESS_ALL_SERVICES_NOTIFICATION
					]
				);
		} );

		it( 'should render the notice between the category filters and the feature list on return from a setup', async () => {
			registry.dispatch( CORE_FEATURE_DISCOVERY ).receivePendingSetup( {
				featureSlug: 'set-up-feature',
				returnTab: ALL_SERVICES_TAB_PATH,
			} );

			const { container, getByText, waitForRegistry } = render(
				<AllServicesTab />,
				{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
			);

			await waitForRegistry();

			expect( getByText( SUCCESS_TITLE ) ).toBeInTheDocument();

			const filters = container.querySelector(
				'.googlesitekit-category-filter-chips'
			) as Element;
			const noticeContainer = container.querySelector(
				'.googlesitekit-all-services-tab__notifications'
			) as Element;
			const featureCard = container.querySelector(
				'.googlesitekit-feature-card'
			) as Element;

			expect( filters.compareDocumentPosition( noticeContainer ) ).toBe(
				Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect(
				noticeContainer.compareDocumentPosition( featureCard )
			).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		} );

		it( 'should not render the notice when the user has not returned from a setup', async () => {
			const { container, queryByText, waitForRegistry } = render(
				<AllServicesTab />,
				{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
			);

			await waitForRegistry();

			expect( queryByText( SUCCESS_TITLE ) ).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-all-services-tab__notifications'
				)
			).toBeEmptyDOMElement();
		} );

		it( 'should remove the notice once it is dismissed', async () => {
			registry.dispatch( CORE_FEATURE_DISCOVERY ).receivePendingSetup( {
				featureSlug: 'set-up-feature',
				returnTab: ALL_SERVICES_TAB_PATH,
			} );

			const { getByRole, queryByText, waitForRegistry } = render(
				<AllServicesTab />,
				{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
			);

			await waitForRegistry();

			fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

			expect( queryByText( SUCCESS_TITLE ) ).not.toBeInTheDocument();
		} );
	} );
} );
