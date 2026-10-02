/**
 * AdsConversionTrackingIntent stories.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import Intents from 'googlesitekit-intents';
import IntentRenderer from '@/js/components/intents/IntentRenderer';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_INTENTS } from '@/js/googlesitekit/datastore/intents/constants';
import { Intent } from '@/js/googlesitekit/datastore/intents/intents';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	ADS_CONVERSION_TRACKING_INTENT_SLUG,
	MODULE_SLUG_ADS,
} from '@/js/modules/ads/constants';
import { MODULES_ADS } from '@/js/modules/ads/datastore/constants';
import { registerIntents } from '@/js/modules/ads/intents';
import { Story } from '@/js/types/Story';
import {
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import AdsConversionTrackingIntent from './AdsConversionTrackingIntent';

// The stories render the intent through `IntentRenderer`, as the dashboard
// does, so the screen shows in the Site Kit header. The check keeps a reloaded
// story file from registering the intent twice.
if ( ! Intents.getRegisteredIntent( ADS_CONVERSION_TRACKING_INTENT_SLUG ) ) {
	registerIntents( Intents );
}

const INTENT_CODE = 'abc123';

interface TemplateProps {
	/** Payload the Site Kit Service returns for the intent. */
	payload: Intent[ 'payload' ];
	/** Sets up any additional state the story shows. */
	setupRegistry?: ( registry: WPDataRegistry ) => void;
}

const Template: FC< TemplateProps > = ( { payload, setupRegistry } ) => (
	<WithRegistrySetup
		func={ ( registry: WPDataRegistry ) => {
			provideSiteInfo( registry );
			provideModules( registry, [
				{ slug: MODULE_SLUG_ADS, active: false, connected: false },
			] );
			provideUserAuthentication( registry );

			registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
			registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );
			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			registry.dispatch( CORE_INTENTS ).receiveGetIntent(
				{
					intent: ADS_CONVERSION_TRACKING_INTENT_SLUG,
					created: '2026-07-30T10:15:00Z',
					payload,
				},
				{
					slug: ADS_CONVERSION_TRACKING_INTENT_SLUG,
					intentCode: INTENT_CODE,
				}
			);
			registry
				.dispatch( CORE_INTENTS )
				.finishResolution( 'getIntent', [
					ADS_CONVERSION_TRACKING_INTENT_SLUG,
					INTENT_CODE,
				] );

			setupRegistry?.( registry );
		} }
	>
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<IntentRenderer
				slug={ ADS_CONVERSION_TRACKING_INTENT_SLUG }
				intentCode={ INTENT_CODE }
			/>
		</ViewContextProvider>
	</WithRegistrySetup>
);

const payload = {
	tag_id: 'AW-763597978',
	customer_name: 'Paws & Puppies Co.',
	consent_date: '2026-07-28',
};

export const Default = Template.bind( {} ) as Story< TemplateProps >;
Default.storyName = 'Default';
Default.args = {
	payload,
};
Default.scenario = {};

export const TagConfirmed = Template.bind( {} ) as Story< TemplateProps >;
TagConfirmed.storyName = 'Tag confirmed';
TagConfirmed.args = {
	payload,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( MODULES_ADS ).confirmConversionTrackingIntentTag();
	},
};
TagConfirmed.scenario = {};

export const NoConsentDate = Template.bind( {} ) as Story< TemplateProps >;
NoConsentDate.storyName = 'No consent date';
NoConsentDate.args = {
	payload: {
		tag_id: 'AW-763597978',
		customer_name: 'Paws & Puppies Co.',
	},
};
NoConsentDate.scenario = {};

export default {
	title: 'Modules/Ads/Intents/AdsConversionTrackingIntent',
	component: AdsConversionTrackingIntent,
	parameters: { padding: 0 },
};
