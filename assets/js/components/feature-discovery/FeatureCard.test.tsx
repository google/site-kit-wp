/**
 * FeatureCard component tests.
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
	actions as featureDiscoveryActions,
	controls as featureDiscoveryControls,
	initialState as featureDiscoveryInitialState,
	reducer as featureDiscoveryReducer,
	resolvers as featureDiscoveryResolvers,
	selectors as featureDiscoverySelectors,
} from '@/js/googlesitekit/datastore/feature-discovery';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_BADGES,
	FEATURE_EFFORTS,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';
import {
	act,
	createTestRegistry,
	provideFeatures,
	provideModules,
	render,
	screen,
} from '@tests/js/test-utils';
import FeatureCard from './FeatureCard';

type Registry = ReturnType< typeof createTestRegistry >;

function provideFeatureNewness(
	registry: Registry,
	newFeatureSlugs: Set< string > = new Set(),
	unreadFeatureSlugs: Set< string > = new Set()
) {
	registry.registerStore( CORE_FEATURE_DISCOVERY, {
		actions: featureDiscoveryActions,
		controls: featureDiscoveryControls,
		initialState: featureDiscoveryInitialState,
		reducer: featureDiscoveryReducer,
		resolvers: featureDiscoveryResolvers,
		selectors: {
			...featureDiscoverySelectors,
			isFeatureNew: ( _state: unknown, slug: string ) =>
				newFeatureSlugs.has( slug ),
			isFeatureUnread: ( _state: unknown, slug: string ) =>
				unreadFeatureSlugs.has( slug ),
		},
	} );
}

describe( 'FeatureCard', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'should resolve its copy, effort, and service from the catalog entry', () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, name: 'Analytics' },
		] );
		registry
			.dispatch( CORE_MODULES )
			.registerModule( MODULE_SLUG_ANALYTICS_4, {
				Icon: AnalyticsIcon,
			} );
		provideFeatures( registry, [
			{
				slug: 'enhanced-measurement',
				title: 'Measure even more visitor interactions',
				shortDescription: 'Collect enhanced measurement events.',
				effort: FEATURE_EFFORTS.MEDIUM,
				moduleSlug: MODULE_SLUG_ANALYTICS_4,
			},
		] );

		const { container } = render(
			<FeatureCard slug="enhanced-measurement" />,
			{ registry }
		);

		expect(
			screen.getByRole( 'heading', {
				name: 'Measure even more visitor interactions',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Collect enhanced measurement events.' )
		).toBeInTheDocument();
		expect( screen.getByText( 'A short setup' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Analytics' ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-feature-card__service svg'
			)
		).toBeInTheDocument();
	} );

	it.each( [ undefined, 'unavailable-module' ] )(
		'should render the Site Kit service identity when the module is %s',
		( moduleSlug ) => {
			provideModules( registry, [] );
			provideFeatures( registry, [
				{ slug: 'key-metrics', moduleSlug },
			] );

			const { container } = render( <FeatureCard slug="key-metrics" />, {
				registry,
			} );

			expect(
				screen.getByText( 'Site Kit feature' )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-feature-card__service svg'
				)
			).toBeInTheDocument();
		}
	);

	it.each( [
		[ true, false, true ],
		[ true, true, false ],
		[ false, false, false ],
	] )(
		'should render the New badge according to newness and hideNewBadge',
		( isNew, hideNewBadge, expected ) => {
			provideFeatureNewness(
				registry,
				new Set( isNew ? [ 'test-feature' ] : [] )
			);
			provideFeatures( registry, [ { slug: 'test-feature' } ] );

			render(
				<FeatureCard
					slug="test-feature"
					hideNewBadge={ hideNewBadge }
				/>,
				{ registry }
			);

			expect( screen.queryByText( 'New' ) !== null ).toBe( expected );
		}
	);

	it.each( [
		[ true, false, true ],
		[ true, true, false ],
		[ false, false, false ],
	] )(
		'should render the unread dot according to unread state and hideUnreadDot',
		( isUnread, hideUnreadDot, expected ) => {
			provideFeatureNewness(
				registry,
				new Set(),
				new Set( isUnread ? [ 'test-feature' ] : [] )
			);
			provideFeatures( registry, [ { slug: 'test-feature' } ] );

			const { container } = render(
				<FeatureCard
					slug="test-feature"
					hideUnreadDot={ hideUnreadDot }
				/>,
				{ registry }
			);

			expect(
				container.querySelector(
					'.googlesitekit-feature-card__unread-dot--visible'
				) !== null
			).toBe( expected );
		}
	);

	it( 'should keep the unread dot visible for three seconds after it is marked seen', () => {
		jest.useFakeTimers();
		const unreadFeatureSlugs = new Set( [ 'test-feature' ] );
		provideFeatureNewness( registry, new Set(), unreadFeatureSlugs );
		provideFeatures( registry, [ { slug: 'test-feature' } ] );

		const { container } = render( <FeatureCard slug="test-feature" />, {
			registry,
		} );
		function getUnreadDot() {
			return container.querySelector(
				'.googlesitekit-feature-card__unread-dot'
			);
		}

		act( () => {
			unreadFeatureSlugs.delete( 'test-feature' );
			provideFeatures( registry, [ { slug: 'state-change' } ] );
		} );

		act( () => {
			jest.advanceTimersByTime( 2999 );
		} );
		expect( getUnreadDot() ).toHaveClass(
			'googlesitekit-feature-card__unread-dot--visible'
		);

		act( () => {
			jest.advanceTimersByTime( 1 );
		} );
		expect( getUnreadDot() ).not.toHaveClass(
			'googlesitekit-feature-card__unread-dot--visible'
		);
		expect( getUnreadDot() ).toBeInTheDocument();
	} );

	it( 'should cancel hiding the dot if the feature becomes unread again', () => {
		jest.useFakeTimers();
		const unreadFeatureSlugs = new Set( [ 'test-feature' ] );
		provideFeatureNewness( registry, new Set(), unreadFeatureSlugs );
		provideFeatures( registry, [ { slug: 'test-feature' } ] );

		const { container } = render( <FeatureCard slug="test-feature" />, {
			registry,
		} );

		act( () => {
			unreadFeatureSlugs.delete( 'test-feature' );
			provideFeatures( registry, [ { slug: 'state-change' } ] );
		} );
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );
		act( () => {
			unreadFeatureSlugs.add( 'test-feature' );
			provideFeatures( registry, [ { slug: 'another-state-change' } ] );
		} );
		act( () => {
			jest.advanceTimersByTime( 3000 );
		} );

		expect(
			container.querySelector( '.googlesitekit-feature-card__unread-dot' )
		).toHaveClass( 'googlesitekit-feature-card__unread-dot--visible' );
	} );

	it( 'should render badges carried by the catalog entry', () => {
		provideFeatures( registry, [
			{
				slug: 'paid-feature',
				badges: [ FEATURE_BADGES.PAID_SERVICE ],
			},
		] );

		render( <FeatureCard slug="paid-feature" />, { registry } );

		expect( screen.getByText( 'Paid service' ) ).toBeInTheDocument();
	} );

	it( 'should render the dismiss control only when the card is dismissible', () => {
		provideFeatures( registry, [
			{ slug: 'test-feature', title: 'Test feature title' },
		] );

		const { rerender } = render( <FeatureCard slug="test-feature" />, {
			registry,
		} );

		expect(
			screen.queryByRole( 'button', {
				name: 'Dismiss Test feature title',
			} )
		).not.toBeInTheDocument();

		rerender( <FeatureCard slug="test-feature" isDismissible /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Dismiss Test feature title',
			} )
		).toBeInTheDocument();
	} );

	it( 'should always render the Read more control', () => {
		provideFeatures( registry, [ { slug: 'test-feature' } ] );

		render( <FeatureCard slug="test-feature" />, { registry } );

		expect(
			screen.getByRole( 'button', { name: 'Read more' } )
		).toBeInTheDocument();
	} );
} );
