/**
 * Feature Discovery App stories.
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
	INITIAL_VERSION,
	sampleFeatures,
	sampleModules,
} from '@/js/components/feature-discovery/__fixtures__/all-services';
import {
	PARTIALLY_SEEN_TIMERS,
	SEEN_TIMERS,
	WHATS_NEW_FEATURES,
	provideFeatures,
	provideWhatsNewState,
} from '@/js/components/feature-discovery/__fixtures__/whats-new';
import {
	ALL_SERVICES_TAB_PATH,
	WHATS_NEW_TAB_PATH,
} from '@/js/components/feature-discovery/constants';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import {
	CORE_FEATURE_DISCOVERY,
	SUCCEEDED_FEATURES_UI_KEY,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { setPendingSetup } from '@/js/googlesitekit/feature-discovery/pending-setup';
import { createNotifications } from '@/js/googlesitekit/notifications';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { registerNotifications as registerReaderRevenueManagerNotifications } from '@/js/modules/reader-revenue-manager/notifications';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideNotifications,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/test-utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureDiscoveryApp from './FeatureDiscoveryApp';

interface StoryArgs {
	setupRegistry?: ( registry: Registry ) => void | Promise< void >;
}

const AUDIENCE_CHIP_SELECTOR =
	'.googlesitekit-category-filter-chips .mdc-chip[data-chip-id="audience"]';

function Template( { setupRegistry = () => {} }: StoryArgs ) {
	async function setupStoryRegistry( registry: Registry ) {
		provideSiteInfo( registry );
		provideModuleRegistrations( registry );
		provideModules( registry, [ { slug: MODULE_SLUG_ADS, name: 'Ads' } ] );

		await setupRegistry( registry );
	}

	return (
		<WithRegistrySetup func={ setupStoryRegistry }>
			<ViewContextProvider value={ VIEW_CONTEXT_FEATURE_DISCOVERY }>
				<FeatureDiscoveryApp />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const AllServices = Template.bind( {} ) as Story< StoryArgs >;
AllServices.storyName = 'All services and features';
AllServices.parameters = { route: '/all-services' };
AllServices.args = {
	setupRegistry: ( registry: Registry ) => {
		provideModules( registry, sampleModules );

		// Seeded so the cards resolve their newness state without a request.
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( INITIAL_VERSION );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		provideFeatures( registry, sampleFeatures );
	},
};
AllServices.scenario = {};

export const AllServicesFiltered = Template.bind( {} ) as Story< StoryArgs >;
AllServicesFiltered.storyName = 'All services filtered to one category';
AllServicesFiltered.parameters = { route: '/all-services' };
AllServicesFiltered.args = AllServices.args;
AllServicesFiltered.scenario = {
	readySelector:
		'.googlesitekit-category-filter-chips .mdc-chip[data-chip-id="audience"].mdc-chip--selected',
};
AllServicesFiltered.play = async () => {
	await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

	const chip = document.querySelector( AUDIENCE_CHIP_SELECTOR );

	chip?.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );
};

export const AllServicesWithSetupError = Template.bind(
	{}
) as Story< StoryArgs >;
AllServicesWithSetupError.storyName = 'All services with Analytics setup error';
AllServicesWithSetupError.parameters = { route: '/all-services' };
AllServicesWithSetupError.args = {
	setupRegistry: ( registry: Registry ) => {
		provideModules( registry, sampleModules );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( INITIAL_VERSION );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		provideFeatures( registry, sampleFeatures );

		registry.dispatch( CORE_FEATURE_DISCOVERY ).setErrorForAction(
			{
				code: 'activation_failed',
				message: 'Could not activate service.',
				data: { status: 500 },
			},
			'setupFeature',
			[ 'analytics-setup' ]
		);
	},
};
AllServicesWithSetupError.scenario = {
	readySelector: '.googlesitekit-feature-setup-error-notice',
};

export const AllServicesWithSetupSuccess = Template.bind(
	{}
) as Story< StoryArgs >;
AllServicesWithSetupSuccess.storyName =
	'All services with setup success notice';
AllServicesWithSetupSuccess.parameters = { route: ALL_SERVICES_TAB_PATH };
AllServicesWithSetupSuccess.args = {
	setupRegistry: async ( registry: Registry ) => {
		provideModules( registry, sampleModules );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( INITIAL_VERSION );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		provideFeatures( registry, sampleFeatures );
		provideNotifications( registry, [] );

		// Stored where the hub reads it on mount, as on a return from setup.
		await setPendingSetup( 'enabled-test-feature', ALL_SERVICES_TAB_PATH );
	},
};
AllServicesWithSetupSuccess.scenario = {
	readySelector: '.googlesitekit-feature-success-notice',
};

export const AllServicesWithInPlaceSetupSuccess = Template.bind(
	{}
) as Story< StoryArgs >;
AllServicesWithInPlaceSetupSuccess.storyName =
	'All services with in-place setup success notice';
AllServicesWithInPlaceSetupSuccess.parameters = {
	route: ALL_SERVICES_TAB_PATH,
};
AllServicesWithInPlaceSetupSuccess.args = {
	setupRegistry: ( registry: Registry ) => {
		provideModules( registry, sampleModules );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( INITIAL_VERSION );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		provideFeatures( registry, sampleFeatures );
		provideNotifications( registry, [] );

		registry
			.dispatch( CORE_UI )
			.setValue( SUCCEEDED_FEATURES_UI_KEY, [ 'key-metrics' ] );
	},
};
AllServicesWithInPlaceSetupSuccess.scenario = {
	readySelector: '.googlesitekit-feature-success-notice',
};

export const WhatsNewUnread = Template.bind( {} ) as Story< StoryArgs >;
WhatsNewUnread.storyName = '"What’s new" unread features';
WhatsNewUnread.parameters = { route: '/whats-new' };
WhatsNewUnread.args = {
	setupRegistry: ( registry: Registry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
	},
};
WhatsNewUnread.scenario = {};

export const WhatsNewSeen = Template.bind( {} ) as Story< StoryArgs >;
WhatsNewSeen.storyName = '"What’s new" seen features';
WhatsNewSeen.parameters = { route: '/whats-new' };
WhatsNewSeen.args = {
	setupRegistry: ( registry: Registry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, SEEN_TIMERS );
	},
};
WhatsNewSeen.scenario = {};

export const WhatsNewWithAutoUpdatesNotice = Template.bind(
	{}
) as Story< StoryArgs >;
WhatsNewWithAutoUpdatesNotice.storyName =
	'"What’s new" with auto-updates notice';
WhatsNewWithAutoUpdatesNotice.parameters = { route: '/whats-new' };
WhatsNewWithAutoUpdatesNotice.args = {
	setupRegistry: ( registry: Registry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: false,
		} );
		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: true,
		} );
		provideNotifications( registry, [] );
	},
};
WhatsNewWithAutoUpdatesNotice.scenario = {};

export const WhatsNewWithSetupSuccess = Template.bind(
	{}
) as Story< StoryArgs >;
WhatsNewWithSetupSuccess.storyName = '"What’s new" with setup success notice';
WhatsNewWithSetupSuccess.parameters = { route: WHATS_NEW_TAB_PATH };
WhatsNewWithSetupSuccess.args = {
	setupRegistry: async ( registry: Registry ) => {
		provideFeatures( registry, [ ...WHATS_NEW_FEATURES ] );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
		// The auto-updates notice also qualifies, so the story shows the
		// success notice taking precedence over it.
		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: false,
		} );
		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: true,
		} );
		provideNotifications( registry, [] );

		// Stored where the hub reads it on mount, as on a return from setup.
		await setPendingSetup( 'enabled-test-feature', WHATS_NEW_TAB_PATH );
	},
};
WhatsNewWithSetupSuccess.scenario = {
	readySelector: '.googlesitekit-feature-success-notice',
};

export const WhatsNewWithInPlaceSetupSuccess = Template.bind(
	{}
) as Story< StoryArgs >;
WhatsNewWithInPlaceSetupSuccess.storyName =
	'"What’s new" with in-place setup success notice';
WhatsNewWithInPlaceSetupSuccess.parameters = { route: WHATS_NEW_TAB_PATH };
WhatsNewWithInPlaceSetupSuccess.args = {
	setupRegistry: ( registry: Registry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
		provideNotifications( registry, [] );

		registry
			.dispatch( CORE_UI )
			.setValue( SUCCEEDED_FEATURES_UI_KEY, [ 'dashboard-sharing' ] );
	},
};
WhatsNewWithInPlaceSetupSuccess.scenario = {
	readySelector: '.googlesitekit-feature-success-notice',
};

function provideReaderRevenueManager(
	registry: Registry,
	{
		paymentOption,
		publicationOnboardingState = PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
	}: { paymentOption: string; publicationOnboardingState?: string }
) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		publicationID: '1234',
		publicationOnboardingState,
		paymentOption,
		productIDs: [ 'product-a', 'product-b' ],
		productID: 'product-a',
	} );

	registerReaderRevenueManagerNotifications(
		createNotifications( registry )
	);
}

export const WhatsNewWithRRMSetupSuccess = Template.bind(
	{}
) as Story< StoryArgs >;
WhatsNewWithRRMSetupSuccess.storyName =
	'"What’s new" with Reader Revenue Manager setup success notice';
WhatsNewWithRRMSetupSuccess.parameters = { route: WHATS_NEW_TAB_PATH };
WhatsNewWithRRMSetupSuccess.args = {
	setupRegistry: async ( registry: Registry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
		provideNotifications( registry, [] );

		provideReaderRevenueManager( registry, {
			paymentOption: 'subscriptions',
		} );

		await setPendingSetup(
			MODULE_SLUG_READER_REVENUE_MANAGER,
			WHATS_NEW_TAB_PATH
		);
	},
};
WhatsNewWithRRMSetupSuccess.scenario = {
	readySelector: '.googlesitekit-notice--success',
};

export const AllServicesWithRRMPublicationApprovedOverlay = Template.bind(
	{}
) as Story< StoryArgs >;
AllServicesWithRRMPublicationApprovedOverlay.storyName =
	'"All services" with Reader Revenue Manager publication approved overlay';
AllServicesWithRRMPublicationApprovedOverlay.parameters = {
	route: ALL_SERVICES_TAB_PATH,
};
AllServicesWithRRMPublicationApprovedOverlay.args = {
	setupRegistry: async ( registry: Registry ) => {
		provideFeatures( registry, sampleFeatures );
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( INITIAL_VERSION );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		provideNotifications( registry, [] );

		provideReaderRevenueManager( registry, { paymentOption: '' } );

		await setPendingSetup(
			MODULE_SLUG_READER_REVENUE_MANAGER,
			ALL_SERVICES_TAB_PATH
		);
	},
};
AllServicesWithRRMPublicationApprovedOverlay.scenario = {
	readySelector: '.googlesitekit-overlay-card',
};

export const WhatsNewEmpty = Template.bind( {} ) as Story< StoryArgs >;
WhatsNewEmpty.storyName = '"What’s new" no features';
WhatsNewEmpty.parameters = { route: '/whats-new' };
WhatsNewEmpty.args = {
	setupRegistry: ( registry: Registry ) => {
		provideWhatsNewState( registry );
	},
};
WhatsNewEmpty.scenario = {};

export default {
	title: 'Components/Feature Discovery/FeatureDiscoveryApp',
	component: FeatureDiscoveryApp,
	parameters: { padding: 0, features: [ 'featureDiscoveryHub' ] },
};
