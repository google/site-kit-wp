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
import { Registry } from '@/js/googlesitekit-data';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import type { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureDismissalKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	provideModules,
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

// Registered in a scrambled order, so the headings can only come out in the
// curated order if the tab takes that order from the categories.
const ONE_FEATURE_PER_CATEGORY: Partial< Feature >[] = [
	FEATURE_CATEGORIES.PRIVACY,
	FEATURE_CATEGORIES.AUDIENCE,
	FEATURE_CATEGORIES.PRODUCTIVITY,
	FEATURE_CATEGORIES.TRAFFIC,
	FEATURE_CATEGORIES.MONETIZATION,
	FEATURE_CATEGORIES.PERFORMANCE,
	FEATURE_CATEGORIES.ENGAGEMENT,
].map( ( category ) => ( {
	slug: `${ category }-feature`,
	title: `${ category } feature`,
	goalCategories: [ category ],
} ) );

const AUDIENCE_FEATURE: Partial< Feature > = {
	slug: 'audience-feature',
	title: 'Audience feature',
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
};

const SECOND_AUDIENCE_FEATURE: Partial< Feature > = {
	slug: 'second-audience-feature',
	title: 'Second audience feature',
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
};

const MONETIZATION_FEATURE: Partial< Feature > = {
	slug: 'monetization-feature',
	title: 'Monetization feature',
	goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
};

const PRODUCTIVITY_FEATURE: Partial< Feature > = {
	slug: 'productivity-feature',
	title: 'Productivity feature',
	goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
};

// Released long before the user's initial version, so it is no longer new.
const OLD_FEATURE: Partial< Feature > = {
	slug: 'old-feature',
	title: 'Old feature',
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	addedInVersion: '1.100.0',
};

// Serves two goals, with engagement as its primary one.
const MULTI_GOAL_FEATURE: Partial< Feature > = {
	slug: 'multi-goal-feature',
	title: 'Multi goal feature',
	goalCategories: [
		FEATURE_CATEGORIES.ENGAGEMENT,
		FEATURE_CATEGORIES.AUDIENCE,
	],
};

// Sets up Analytics, so it is listed only while Analytics is disconnected.
const SETUP_MODULE_FEATURE: Partial< Feature > = {
	slug: 'setup-module-feature',
	title: 'Setup module feature',
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	setup: {
		type: FEATURE_SETUP_TYPES.SETUP_FLOW,
		moduleSlug: MODULE_SLUG_ANALYTICS_4,
	},
};

// Depends on Analytics, so it is listed only once Analytics is connected.
const PREREQUISITE_FEATURE: Partial< Feature > = {
	slug: 'prerequisite-feature',
	title: 'Prerequisite feature',
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	prerequisiteModules: [ MODULE_SLUG_ANALYTICS_4 ],
};

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
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );
	} );

	it( 'should render goal headings in the curated order', async () => {
		provideFeatures( registry, [
			PRODUCTIVITY_FEATURE,
			MONETIZATION_FEATURE,
			AUDIENCE_FEATURE,
		] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getHeadings( container ) ).toEqual( [
			AUDIENCE_HEADING,
			MONETIZATION_HEADING,
			PRODUCTIVITY_HEADING,
		] );
	} );

	it( 'should render every goal heading in the curated order', async () => {
		provideFeatures( registry, ONE_FEATURE_PER_CATEGORY );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getHeadings( container ) ).toEqual( ALL_HEADINGS );
	} );

	it( 'should list features however long ago they were released, including one that is still new', async () => {
		provideFeatures( registry, [ OLD_FEATURE, AUDIENCE_FEATURE ] );

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
		} );

		await waitForRegistry();

		// Both are listed here all the same.
		expect( getCardTitles( container ) ).toEqual( [
			'Old feature',
			'Audience feature',
		] );
	} );

	it( 'should not render a heading for a goal with nothing to list', async () => {
		provideFeatures( registry, [ AUDIENCE_FEATURE ] );

		const { container, queryByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry }
		);

		await waitForRegistry();

		expect( getHeadings( container ) ).toEqual( [ AUDIENCE_HEADING ] );

		expect(
			queryByRole( 'heading', { name: MONETIZATION_HEADING } )
		).not.toBeInTheDocument();
	} );

	it( 'should list a feature serving several goals once, under its primary goal', async () => {
		provideFeatures( registry, [ AUDIENCE_FEATURE, MULTI_GOAL_FEATURE ] );

		const { container, getAllByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry }
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

	it( 'should keep catalog registration order within a group', async () => {
		provideFeatures( registry, [
			SECOND_AUDIENCE_FEATURE,
			AUDIENCE_FEATURE,
		] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
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

		provideFeatures( registry, [ AUDIENCE_FEATURE ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [ 'Audience feature' ] );
	} );

	it( 'should not list a feature that is already set up', async () => {
		provideAnalytics( true );
		provideFeatures( registry, [ AUDIENCE_FEATURE, SETUP_MODULE_FEATURE ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [ 'Audience feature' ] );
	} );

	it( 'should not list a feature whose prerequisite module is not connected', async () => {
		provideAnalytics( false );
		provideFeatures( registry, [ AUDIENCE_FEATURE, PREREQUISITE_FEATURE ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [ 'Audience feature' ] );
	} );

	it( 'should list a feature once its prerequisite module is connected', async () => {
		provideAnalytics( true );
		provideFeatures( registry, [ AUDIENCE_FEATURE, PREREQUISITE_FEATURE ] );

		const { container, waitForRegistry } = render( <AllServicesTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getCardTitles( container ) ).toEqual( [
			'Audience feature',
			'Prerequisite feature',
		] );
	} );

	it( 'should not render a dismiss control on any card', async () => {
		provideFeatures( registry, [ AUDIENCE_FEATURE, MONETIZATION_FEATURE ] );

		const { container, queryByRole, waitForRegistry } = render(
			<AllServicesTab />,
			{ registry }
		);

		await waitForRegistry();

		expect( getCardTitles( container ) ).toHaveLength( 2 );

		expect(
			queryByRole( 'button', { name: /^Dismiss/ } )
		).not.toBeInTheDocument();
	} );
} );
