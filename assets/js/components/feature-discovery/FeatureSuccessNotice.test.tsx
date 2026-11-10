/**
 * FeatureSuccessNotice component tests.
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
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import * as tracking from '@/js/util/tracking';
import { mockIntersectionObserver } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
} from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import FeatureSuccessNotice from './FeatureSuccessNotice';

const mockOnCTAClick = jest.fn();
const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );

mockTrackEvent.mockImplementation( () => Promise.resolve() );

const { simulateAllIntersections } = mockIntersectionObserver();

const EVENT_CATEGORY = `${ VIEW_CONTEXT_FEATURE_DISCOVERY }_feature-setup-success-notification`;

describe( 'FeatureSuccessNotice', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
		mockOnCTAClick.mockClear();
	} );

	it( 'should render the title, description, CTA and dismiss from the feature', () => {
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				successNotice: {
					title: 'Success! Test feature is set up',
					description: 'You can manage it in Settings',
					cta: {
						label: 'Go to Settings',
						getURL: ( select ) =>
							select( CORE_SITE ).getAdminURL(
								'googlesitekit-settings'
							),
						external: true,
						onClick: mockOnCTAClick,
					},
				},
			},
		] );

		const settingsURL = registry
			.select( CORE_SITE )
			.getAdminURL( 'googlesitekit-settings' );

		const { getByRole, getByText } = render(
			<FeatureSuccessNotice
				slug="test-feature"
				onDismiss={ jest.fn() }
			/>,
			{ registry }
		);

		expect(
			getByText( 'Success! Test feature is set up' )
		).toBeInTheDocument();
		expect(
			getByText( 'You can manage it in Settings' )
		).toBeInTheDocument();

		const cta = getByRole( 'button', { name: /Go to Settings/ } );
		expect( cta ).toHaveAttribute( 'href', settingsURL );
		expect( cta ).toHaveAttribute( 'target', '_blank' );

		fireEvent.click( cta );
		expect( mockOnCTAClick ).toHaveBeenCalledTimes( 1 );

		expect( getByRole( 'button', { name: 'Got it' } ) ).toBeInTheDocument();
	} );

	it( 'should use the dismiss label the feature gives', () => {
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				successNotice: {
					title: 'Success! Test feature is set up',
					dismissLabel: 'Done',
				},
			},
		] );

		const { getByRole, queryByRole } = render(
			<FeatureSuccessNotice
				slug="test-feature"
				onDismiss={ jest.fn() }
			/>,
			{ registry }
		);

		expect( getByRole( 'button', { name: 'Done' } ) ).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: 'Got it' } )
		).not.toBeInTheDocument();
	} );

	it( 'should not render a CTA when the feature gives none', () => {
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				successNotice: {
					title: 'Success! Test feature is set up',
				},
			},
		] );

		const { getAllByRole, getByRole } = render(
			<FeatureSuccessNotice
				slug="test-feature"
				onDismiss={ jest.fn() }
			/>,
			{ registry }
		);

		expect( getByRole( 'button', { name: 'Got it' } ) ).toBeInTheDocument();
		expect( getAllByRole( 'button' ) ).toHaveLength( 1 );
	} );

	it( 'should call onDismiss when dismissed', () => {
		const onDismiss = jest.fn();

		provideFeatures( registry, [
			{
				slug: 'test-feature',
				successNotice: {
					title: 'Success! Test feature is set up',
				},
			},
		] );

		const { getByRole } = render(
			<FeatureSuccessNotice
				slug="test-feature"
				onDismiss={ onDismiss }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render nothing for a feature without a success notice', () => {
		provideFeatures( registry, [ { slug: 'test-feature' } ] );

		const { container } = render(
			<FeatureSuccessNotice
				slug="test-feature"
				onDismiss={ jest.fn() }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing for an unknown feature', () => {
		const { container } = render(
			<FeatureSuccessNotice
				slug="unknown-feature"
				onDismiss={ jest.fn() }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	describe( 'GA tracking', () => {
		beforeEach( () => {
			provideFeatures( registry, [
				{
					slug: 'test-feature',
					successNotice: {
						title: 'Success! Test feature is set up',
						cta: {
							label: 'Go to Settings',
							onClick: mockOnCTAClick,
						},
					},
				},
			] );
		} );

		it( 'should track view_notification when the notice becomes visible', () => {
			render(
				<FeatureSuccessNotice
					slug="test-feature"
					onDismiss={ jest.fn() }
				/>,
				{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
			);

			expect( mockTrackEvent ).not.toHaveBeenCalled();

			act( () => {
				simulateAllIntersections( true );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				EVENT_CATEGORY,
				'view_notification',
				'test-feature'
			);
		} );

		it( 'should not track view_notification when trackViewEvent is false', () => {
			render(
				<FeatureSuccessNotice
					slug="test-feature"
					onDismiss={ jest.fn() }
					trackViewEvent={ false }
				/>,
				{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
			);

			act( () => {
				simulateAllIntersections( true );
			} );

			expect( mockTrackEvent ).not.toHaveBeenCalled();
		} );

		it( 'should track confirm_notification when the CTA is clicked', () => {
			const { getByRole } = render(
				<FeatureSuccessNotice
					slug="test-feature"
					onDismiss={ jest.fn() }
				/>,
				{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
			);

			fireEvent.click(
				getByRole( 'button', { name: /Go to Settings/ } )
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				EVENT_CATEGORY,
				'confirm_notification',
				'test-feature'
			);

			expect( mockOnCTAClick ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should track dismiss_notification when dismissed', () => {
			const onDismiss = jest.fn();

			const { getByRole } = render(
				<FeatureSuccessNotice
					slug="test-feature"
					onDismiss={ onDismiss }
				/>,
				{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
			);

			fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				EVENT_CATEGORY,
				'dismiss_notification',
				'test-feature'
			);

			expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
