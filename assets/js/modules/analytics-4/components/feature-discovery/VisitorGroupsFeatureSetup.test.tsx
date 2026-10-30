/**
 * VisitorGroupsFeatureSetup component tests.
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
import { getItem } from '@/js/googlesitekit/api/cache';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { getFeatureSetupSurveyTriggerID } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	FEATURE_DISCOVERY_SETUP_CACHE_KEY,
	getCurrentFeatureDiscoveryTabPath,
} from '@/js/googlesitekit/feature-discovery/pending-setup';
import useEnableAudienceGroup from '@/js/modules/analytics-4/hooks/useEnableAudienceGroup';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import VisitorGroupsFeatureSetup from './VisitorGroupsFeatureSetup';

jest.mock( '@/js/modules/analytics-4/hooks/useEnableAudienceGroup' );

const SLUG = 'visitor-groups';
const API_ERROR = {
	code: 'test_error',
	message: 'Error message.',
	data: { status: 500 },
};

interface HookOptions {
	onOAuthNavigation?: () => Promise< void >;
	onSuccess?: () => void;
	redirectURL?: string;
}

describe( 'VisitorGroupsFeatureSetup', () => {
	let registry: Registry;
	let onEnableGroups: jest.Mock;
	let hookState: {
		apiErrors: unknown[];
		failedAudiences: string[];
		isAudienceCreationError: boolean;
		isSaving: boolean;
	};
	let hookOptions: HookOptions;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );
		provideSiteInfo( registry );

		provideFeatures( registry, [
			{
				slug: SLUG,
				title: 'Visitor groups',
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					ctaLabel: 'Enable visitor groups',
				},
			},
		] );

		onEnableGroups = jest.fn();
		hookState = {
			apiErrors: [],
			failedAudiences: [],
			isAudienceCreationError: false,
			isSaving: false,
		};

		( useEnableAudienceGroup as jest.Mock ).mockImplementation(
			( options: HookOptions ) => {
				hookOptions = options;

				return { ...hookState, onEnableGroups };
			}
		);
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'triggers the setup survey and enables the groups when the card CTA is clicked', () => {
		const triggerSurvey = jest
			.spyOn( registry.dispatch( CORE_USER ), 'triggerSurvey' )
			.mockResolvedValue( undefined );

		const { getByRole } = render(
			<VisitorGroupsFeatureSetup slug={ SLUG } hideUnreadDot />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Enable visitor groups' } )
		);

		expect( triggerSurvey ).toHaveBeenCalledWith(
			getFeatureSetupSurveyTriggerID( SLUG )
		);
		expect( onEnableGroups ).toHaveBeenCalledTimes( 1 );
		expect( triggerSurvey.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			onEnableGroups.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'shows the CTA as in progress while the groups are being created', () => {
		hookState.isSaving = true;

		const { getByRole } = render(
			<VisitorGroupsFeatureSetup slug={ SLUG } hideUnreadDot />,
			{ registry }
		);

		expect(
			getByRole( 'button', { name: /Enable visitor groups/ } )
		).toBeDisabled();
	} );

	it( 'returns the user to the hub and records the setup before the OAuth navigation', async () => {
		global.location.hash = '#/whats-new';

		render( <VisitorGroupsFeatureSetup slug={ SLUG } hideUnreadDot />, {
			registry,
		} );

		expect( hookOptions.redirectURL ).toBe( global.location.href );

		await hookOptions.onOAuthNavigation?.();

		const { cacheHit, value } = await getItem(
			FEATURE_DISCOVERY_SETUP_CACHE_KEY
		);

		expect( cacheHit ).toBe( true );
		expect( value ).toEqual( {
			featureSlug: SLUG,
			returnTab: getCurrentFeatureDiscoveryTabPath(),
		} );

		global.location.hash = '';
	} );

	it( 'starts the setup once when requested from the detail panel, and marks the request handled', () => {
		const onSetupRequestHandled = jest.fn();
		jest.spyOn(
			registry.dispatch( CORE_USER ),
			'triggerSurvey'
		).mockResolvedValue( undefined );

		const { rerender } = render(
			<VisitorGroupsFeatureSetup
				slug={ SLUG }
				onSetupRequestHandled={ onSetupRequestHandled }
				hideUnreadDot
				isSetupRequested
			/>,
			{ registry }
		);

		expect( onSetupRequestHandled ).toHaveBeenCalledTimes( 1 );
		expect( onEnableGroups ).toHaveBeenCalledTimes( 1 );

		rerender(
			<VisitorGroupsFeatureSetup
				slug={ SLUG }
				onSetupRequestHandled={ onSetupRequestHandled }
				hideUnreadDot
				isSetupRequested
			/>
		);

		expect( onEnableGroups ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stores a setup failure and replaces the card with the error widget, dismissed with "Got it"', async () => {
		const { rerender, getByText, getByRole, queryByRole } = render(
			<VisitorGroupsFeatureSetup slug={ SLUG } hideUnreadDot />,
			{ registry }
		);

		hookState.apiErrors = [ API_ERROR ];

		rerender( <VisitorGroupsFeatureSetup slug={ SLUG } hideUnreadDot /> );

		await waitFor( () => {
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getErrorForAction( 'setupFeature', [ SLUG ] )
			).toEqual( API_ERROR );
		} );

		expect(
			getByText( 'Visitor groups setup failed' )
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: 'Enable visitor groups' } )
		).not.toBeInTheDocument();

		hookState.apiErrors = [];
		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

		await waitFor( () => {
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getErrorForAction( 'setupFeature', [ SLUG ] )
			).toBeUndefined();
		} );

		expect(
			getByRole( 'button', { name: 'Enable visitor groups' } )
		).toBeInTheDocument();
	} );

	it( 'clears the stored failure once a later attempt succeeds', async () => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.setErrorForAction( API_ERROR, 'setupFeature', [ SLUG ] );

		render( <VisitorGroupsFeatureSetup slug={ SLUG } hideUnreadDot />, {
			registry,
		} );

		act( () => {
			hookOptions.onSuccess?.();
		} );

		await waitFor( () => {
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getErrorForAction( 'setupFeature', [ SLUG ] )
			).toBeUndefined();
		} );
	} );

	it( 'retries through the hook, which retries only the audiences that failed', async () => {
		hookState.failedAudiences = [ 'new-visitors' ];
		hookState.isAudienceCreationError = true;

		const { getByText, getByRole } = render(
			<VisitorGroupsFeatureSetup slug={ SLUG } hideUnreadDot />,
			{ registry }
		);

		await waitFor( () => {
			expect(
				getByText( 'Creating visitor groups failed' )
			).toBeInTheDocument();
		} );

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		expect( onEnableGroups ).toHaveBeenCalledTimes( 1 );
		expect(
			registry
				.select( CORE_FEATURE_DISCOVERY )
				.getErrorForAction( 'setupFeature', [ SLUG ] )
		).toBeUndefined();
	} );
} );
