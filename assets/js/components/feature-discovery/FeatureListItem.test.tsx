/**
 * FeatureListItem component tests.
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
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeatureListItem from './FeatureListItem';

const SETUP_ERROR = {
	code: 'activation_failed',
	message: 'Could not activate service.',
	data: { status: 500 },
};

describe( 'FeatureListItem', () => {
	function setupRegistryWithSetupFlowFeature() {
		const registry = createTestRegistry();

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );

		provideFeatures( registry, [
			{
				slug: 'test-feature',
				title: 'Analytics',
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					ctaLabel: 'Set up now',
				},
			},
		] );

		return registry;
	}

	it.each( [
		[ 'whats-new tab context', 'googlesitekit-whats-new__list' ],
		[ 'all-services tab context', 'googlesitekit-all-services-tab__grid' ],
	] )(
		'shows a setup error notice in place of the card for %s',
		async ( _, wrapperClassName ) => {
			const registry = setupRegistryWithSetupFlowFeature();

			registry
				.dispatch( CORE_FEATURE_DISCOVERY )
				.setErrorForAction( SETUP_ERROR, 'setupFeature', [
					'test-feature',
				] );

			const { getByRole, getByText, queryByRole } = render(
				<div className={ wrapperClassName }>
					<FeatureListItem slug="test-feature" hideUnreadDot />
				</div>,
				{ registry }
			);

			await waitFor( () =>
				expect(
					getByText( 'Analytics setup failed' )
				).toBeInTheDocument()
			);

			expect(
				getByRole( 'button', { name: 'Retry' } )
			).toBeInTheDocument();
			expect(
				queryByRole( 'button', { name: 'Set up now' } )
			).not.toBeInTheDocument();
		}
	);

	it( 'should retry the same setup when Retry is clicked', async () => {
		const registry = setupRegistryWithSetupFlowFeature();

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.setErrorForAction( SETUP_ERROR, 'setupFeature', [
				'test-feature',
			] );

		const setupFeature = jest
			.spyOn(
				registry.dispatch( CORE_FEATURE_DISCOVERY ),
				'setupFeature'
			)
			.mockResolvedValue( undefined );

		const { getByRole, getByText } = render(
			<FeatureListItem slug="test-feature" hideUnreadDot />,
			{ registry }
		);

		await waitFor( () =>
			expect( getByText( 'Analytics setup failed' ) ).toBeInTheDocument()
		);

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		await waitFor( () => {
			expect( setupFeature ).toHaveBeenCalledWith( 'test-feature' );
		} );
	} );

	it( 'should restore the card to its pre-setup state when Got it is clicked', async () => {
		const registry = setupRegistryWithSetupFlowFeature();

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.setErrorForAction( SETUP_ERROR, 'setupFeature', [
				'test-feature',
			] );

		const { getByRole, getByText, queryByText } = render(
			<FeatureListItem slug="test-feature" hideUnreadDot />,
			{ registry }
		);

		await waitFor( () =>
			expect( getByText( 'Analytics setup failed' ) ).toBeInTheDocument()
		);

		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

		await waitFor( () => {
			expect(
				queryByText( 'Analytics setup failed' )
			).not.toBeInTheDocument();
		} );

		expect(
			getByRole( 'button', { name: 'Set up now' } )
		).toBeInTheDocument();
	} );

	it( 'should show setup errors already in the store, matching the detail panel setup path', () => {
		const registry = setupRegistryWithSetupFlowFeature();

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.setErrorForAction( SETUP_ERROR, 'setupFeature', [
				'test-feature',
			] );

		const { getByText, queryByRole } = render(
			<FeatureListItem slug="test-feature" hideUnreadDot />,
			{ registry }
		);

		expect( getByText( 'Analytics setup failed' ) ).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: 'Set up now' } )
		).not.toBeInTheDocument();
	} );

	it( 'should keep the notice and Retry spinner visible while setup is still running', async () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );

		provideModules( registry, [
			{ slug: 'test-module', name: 'Test module', active: false },
		] );

		provideFeatures( registry, [
			{
				slug: 'test-feature',
				title: 'Analytics',
				setup: {
					type: FEATURE_SETUP_TYPES.SETUP_FLOW,
					ctaLabel: 'Set up now',
					moduleSlug: 'test-module',
				},
			},
		] );

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.setErrorForAction( SETUP_ERROR, 'setupFeature', [
				'test-feature',
			] );

		let resolveActivation!: ( value: unknown ) => void;
		const activationPromise = new Promise( ( resolve ) => {
			resolveActivation = resolve;
		} );

		jest.spyOn(
			registry.dispatch( CORE_MODULES ),
			'activateModule'
		).mockReturnValue( activationPromise );

		const { getByRole, getByText, queryByText } = render(
			<FeatureListItem slug="test-feature" hideUnreadDot />,
			{ registry }
		);

		await waitFor( () => {
			expect( getByText( 'Analytics setup failed' ) ).toBeInTheDocument();
		} );

		const retryButton = getByRole( 'button', { name: 'Retry' } );
		fireEvent.click( retryButton );

		await waitFor( () => {
			expect( getByText( 'Analytics setup failed' ) ).toBeInTheDocument();
			expect( retryButton ).toHaveClass(
				'googlesitekit-notice__cta--spinner__running'
			);
		} );

		resolveActivation( {
			response: {
				success: true,
				moduleReauthURL: 'http://example.com/reauth',
			},
		} );

		await waitFor( () => {
			expect(
				queryByText( 'Analytics setup failed' )
			).not.toBeInTheDocument();
		} );
	} );
} );
