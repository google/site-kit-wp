/**
 * FeatureCTA component tests.
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
import { Registry, Select } from '@/js/googlesitekit-data';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeatureCTA from './FeatureCTA';

describe( 'FeatureCTA', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, name: 'Analytics' },
		] );

		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
	} );

	it( 'should label the button from the feature’s catalog entry', () => {
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					ctaLabel: 'Try it now',
				},
			},
		] );

		const { getByRole } = render( <FeatureCTA slug="test-feature" />, {
			registry,
		} );

		expect(
			getByRole( 'button', { name: 'Try it now' } )
		).toBeInTheDocument();
	} );

	it( 'should render nothing for a feature that is not registered', () => {
		const { queryByRole } = render( <FeatureCTA slug="absent-feature" />, {
			registry,
		} );

		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'should render nothing for a feature whose entry carries no CTA label', () => {
		// Not `provideFeatures`, which supplies a default label.
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', {
				title: 'Test feature',
				shortDescription: 'Test feature description.',
				effort: FEATURE_EFFORTS.LOW,
				goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
				addedInVersion: '1.186.0',
				setup: { type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE },
			} );

		const { queryByRole } = render( <FeatureCTA slug="test-feature" />, {
			registry,
		} );

		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'should apply the tertiary button style when isTertiary is set', () => {
		provideFeatures( registry, [ { slug: 'test-feature' } ] );

		const { getByRole } = render(
			<FeatureCTA slug="test-feature" isTertiary />,
			{ registry }
		);

		expect( getByRole( 'button', { name: 'Set up now' } ) ).toHaveClass(
			'mdc-button--tertiary'
		);
	} );

	describe( 'availability', () => {
		function provideSetupFlowFeature() {
			provideFeatures( registry, [
				{
					slug: 'analytics',
					moduleSlug: MODULE_SLUG_ANALYTICS_4,
					setup: {
						type: FEATURE_SETUP_TYPES.SETUP_FLOW,
						ctaLabel: 'Set up Analytics',
						moduleSlug: MODULE_SLUG_ANALYTICS_4,
					},
				},
			] );
		}

		it( 'should render the CTA when the feature’s service can be connected', () => {
			provideSetupFlowFeature();

			registry
				.dispatch( CORE_MODULES )
				.receiveCheckRequirementsSuccess( MODULE_SLUG_ANALYTICS_4 );

			const { getByRole } = render( <FeatureCTA slug="analytics" />, {
				registry,
			} );

			expect(
				getByRole( 'button', { name: 'Set up Analytics' } )
			).toBeInTheDocument();
		} );

		it( 'should render nothing when the feature’s service cannot be connected', () => {
			provideSetupFlowFeature();

			registry
				.dispatch( CORE_MODULES )
				.receiveCheckRequirementsError( MODULE_SLUG_ANALYTICS_4, {
					code: 'insufficient_module_dependencies',
					message: 'You need to set up Analytics.',
					data: { inactiveModules: [ 'Analytics' ] },
				} );

			const { queryByRole } = render( <FeatureCTA slug="analytics" />, {
				registry,
			} );

			expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
		} );

		it( 'should render the CTA for a setup-flow feature that activates no module', () => {
			provideFeatures( registry, [
				{
					slug: 'key-metrics',
					setup: {
						type: FEATURE_SETUP_TYPES.SETUP_FLOW,
						ctaLabel: 'Set up Key metrics',
					},
				},
			] );

			const { getByRole } = render( <FeatureCTA slug="key-metrics" />, {
				registry,
			} );

			expect(
				getByRole( 'button', { name: 'Set up Key metrics' } )
			).toBeInTheDocument();
		} );

		it( 'should render nothing when the feature’s own requirements are unmet', () => {
			provideFeatures( registry, [
				{
					slug: 'test-feature',
					checkRequirements: ( select: Select ) =>
						!! select( CORE_MODULES ).isModuleConnected(
							'nonexistent-module'
						),
				},
			] );

			const { queryByRole } = render(
				<FeatureCTA slug="test-feature" />,
				{
					registry,
				}
			);

			expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
		} );

		it( 'should render the CTA when the feature’s own requirements are met', () => {
			provideFeatures( registry, [
				{
					slug: 'test-feature',
					checkRequirements: () => true,
				},
			] );

			const { getByRole } = render( <FeatureCTA slug="test-feature" />, {
				registry,
			} );

			expect(
				getByRole( 'button', { name: 'Set up now' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'on click', () => {
		beforeEach( () => {
			provideFeatures( registry, [ { slug: 'test-feature' } ] );
		} );

		it( 'should record the setup having been started through the survey pipeline', async () => {
			fetchMock.post( surveyTriggerEndpoint, {
				status: 200,
				body: {},
			} );

			const { getByRole } = render( <FeatureCTA slug="test-feature" />, {
				registry,
			} );

			fireEvent.click( getByRole( 'button', { name: 'Set up now' } ) );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: {
							triggerID: 'setup:feature_setup_test-feature',
						},
					},
				} )
			);
		} );

		it( 'should show the in-progress state while the setup it is waiting on runs', async () => {
			fetchMock.post( surveyTriggerEndpoint, {
				status: 200,
				body: {},
			} );

			const { getByRole } = render( <FeatureCTA slug="test-feature" />, {
				registry,
			} );

			const button = getByRole( 'button', { name: 'Set up now' } );

			expect( button ).not.toBeDisabled();

			fireEvent.click( button );

			// Entered synchronously, before the handler awaits anything.
			expect( button ).toBeDisabled();
			expect( button ).toHaveClass(
				'googlesitekit-button-icon--spinner__running'
			);

			await waitFor( () => expect( button ).not.toBeDisabled() );

			expect( button ).not.toHaveClass(
				'googlesitekit-button-icon--spinner__running'
			);
		} );
	} );
} );
