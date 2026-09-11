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
	CORE_FEATURE_DISCOVERY,
	FEATURE_BADGES,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { FeatureSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureNewnessKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';
import {
	act,
	createTestRegistry,
	provideModules,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeatureCard from './FeatureCard';

type Registry = ReturnType< typeof createTestRegistry >;

const TEST_OLD_VERSION = '1.84.0';
const TEST_INITIAL_VERSION = '1.86.0';
const TEST_NEW_VERSION = '1.87.0';

const TEST_FEATURE_SETTINGS: FeatureSettings = {
	title: 'Test feature title',
	shortDescription: 'Test feature description.',
	effort: FEATURE_EFFORTS.LOW,
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	addedInVersion: TEST_OLD_VERSION,
	setup: {
		type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
	},
};

const TEST_NEW_FEATURE_SETTINGS: FeatureSettings = {
	...TEST_FEATURE_SETTINGS,
	addedInVersion: TEST_NEW_VERSION,
};

const TEST_MODULE_FEATURE_SETTINGS: FeatureSettings = {
	...TEST_FEATURE_SETTINGS,
	title: 'Measure even more visitor interactions',
	shortDescription: 'Collect enhanced measurement events.',
	effort: FEATURE_EFFORTS.MEDIUM,
	moduleSlug: MODULE_SLUG_ANALYTICS_4,
};

const TEST_BADGED_FEATURE_SETTINGS: FeatureSettings = {
	...TEST_FEATURE_SETTINGS,
	badges: [ FEATURE_BADGES.PAID_SERVICE ],
};

describe( 'FeatureCard', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( TEST_INITIAL_VERSION );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'should resolve its copy, effort, and service from the catalog entry', () => {
		const AnalyticsIconSpy = jest.fn( AnalyticsIcon );

		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, name: 'Analytics' },
		] );

		registry
			.dispatch( CORE_MODULES )
			.registerModule( MODULE_SLUG_ANALYTICS_4, {
				Icon: AnalyticsIconSpy,
			} );

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature(
				'enhanced-measurement',
				TEST_MODULE_FEATURE_SETTINGS
			);

		const { getByRole, getByText } = render(
			<FeatureCard slug="enhanced-measurement" />,
			{ registry }
		);

		expect(
			getByRole( 'heading', {
				name: 'Measure even more visitor interactions',
			} )
		).toBeInTheDocument();

		expect(
			getByText( 'Collect enhanced measurement events.' )
		).toBeInTheDocument();

		expect( getByText( 'A short setup' ) ).toBeInTheDocument();
		expect( getByText( 'Analytics' ) ).toBeInTheDocument();

		expect( AnalyticsIconSpy ).toHaveBeenCalled();
	} );

	it( 'should render the Site Kit service identity by default', () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'key-metrics', TEST_FEATURE_SETTINGS );

		const { getByText } = render( <FeatureCard slug="key-metrics" />, {
			registry,
		} );

		expect( getByText( 'Site Kit feature' ) ).toBeInTheDocument();
	} );

	it( 'should render the unread dot and New badge for new features', async () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', TEST_NEW_FEATURE_SETTINGS );

		const { container, getByText } = render(
			<FeatureCard slug="test-feature" />,
			{ registry }
		);

		expect( getByText( 'New' ) ).toBeInTheDocument();

		await waitFor( () => {
			expect(
				container.querySelector(
					'.googlesitekit-feature-card__dot--visible'
				)
			).toBeInTheDocument();
		} );
	} );

	it( 'should not render the unread dot or New badge for non-new features', () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', TEST_FEATURE_SETTINGS );

		const { container, queryByText } = render(
			<FeatureCard slug="test-feature" />,
			{ registry }
		);

		expect( queryByText( 'New' ) ).not.toBeInTheDocument();

		expect(
			container.querySelector(
				'.googlesitekit-feature-card__dot--visible'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should hide the New badge for a new feature when hideNewBadge is set', async () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', TEST_NEW_FEATURE_SETTINGS );

		const { container, queryByText } = render(
			<FeatureCard slug="test-feature" hideNewBadge />,
			{ registry }
		);

		await waitFor( () => {
			expect(
				container.querySelector(
					'.googlesitekit-feature-card__dot--visible'
				)
			).toBeInTheDocument();
		} );

		expect( queryByText( 'New' ) ).not.toBeInTheDocument();
	} );

	it( 'should hide the unread dot for a new feature when hideUnreadDot is set', async () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', TEST_NEW_FEATURE_SETTINGS );

		const { container, getByText, rerender } = render(
			<FeatureCard slug="test-feature" />,
			{ registry }
		);

		await waitFor( () => {
			expect(
				container.querySelector(
					'.googlesitekit-feature-card__dot--visible'
				)
			).toBeInTheDocument();
		} );

		rerender( <FeatureCard slug="test-feature" hideUnreadDot /> );

		expect( getByText( 'New' ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-feature-card__dot--visible'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should keep the unread dot visible for three seconds after it is marked seen', () => {
		jest.useFakeTimers();

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', TEST_NEW_FEATURE_SETTINGS );

		const { container } = render( <FeatureCard slug="test-feature" />, {
			registry,
		} );

		expect(
			container.querySelector( '.googlesitekit-feature-card__dot' )
		).toHaveClass( 'googlesitekit-feature-card__dot--visible' );

		act( () => {
			registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				[ getFeatureNewnessKey( 'test-feature' ) ]:
					Number.MAX_SAFE_INTEGER,
			} );
		} );

		act( () => {
			jest.advanceTimersByTime( 2999 );
		} );

		expect(
			container.querySelector( '.googlesitekit-feature-card__dot' )
		).toHaveClass( 'googlesitekit-feature-card__dot--visible' );

		act( () => {
			jest.advanceTimersByTime( 1 );
		} );

		expect(
			container.querySelector( '.googlesitekit-feature-card__dot' )
		).not.toHaveClass( 'googlesitekit-feature-card__dot--visible' );
	} );

	it( 'should render badges carried by the catalog entry', () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'paid-feature', TEST_BADGED_FEATURE_SETTINGS );

		const { getByText } = render( <FeatureCard slug="paid-feature" />, {
			registry,
		} );

		expect( getByText( 'Paid service' ) ).toBeInTheDocument();
	} );

	it( 'should render the dismiss control only when the card is dismissible', () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', TEST_FEATURE_SETTINGS );

		const { getByRole, queryByRole, rerender } = render(
			<FeatureCard slug="test-feature" />,
			{ registry }
		);

		expect(
			queryByRole( 'button', {
				name: 'Dismiss Test feature title',
			} )
		).not.toBeInTheDocument();

		rerender( <FeatureCard slug="test-feature" isDismissible /> );

		expect(
			getByRole( 'button', {
				name: 'Dismiss Test feature title',
			} )
		).toBeInTheDocument();
	} );
} );
