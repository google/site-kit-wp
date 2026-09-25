/**
 * IntentRenderer stories.
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
import Null from '@/js/components/Null';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_INTENTS } from '@/js/googlesitekit/datastore/intents/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import {
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import IntentRenderer from './IntentRenderer';

// With no component registered for the slug, `IntentRenderer` renders the
// main dashboard instead of the loading and error states.
Intents.registerIntent( 'example-intent', { Component: Null } );

interface TemplateProps {
	/** Sets up the `core/intents` state the story shows. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
}

const Template: FC< TemplateProps > = ( { setupRegistry } ) => (
	<WithRegistrySetup
		func={ ( registry: WPDataRegistry ) => {
			provideSiteInfo( registry );
			provideModules( registry );
			provideUserAuthentication( registry );

			registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
			registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );
			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			setupRegistry( registry );
		} }
	>
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<IntentRenderer slug="example-intent" intentCode="abc123" />
		</ViewContextProvider>
	</WithRegistrySetup>
);

export const Loading = Template.bind( {} ) as Story< TemplateProps >;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( CORE_INTENTS )
			.startResolution( 'getIntent', [ 'example-intent', 'abc123' ] );
	},
};

export const Error = Template.bind( {} ) as Story< TemplateProps >;
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( CORE_INTENTS ).setErrorForSelector(
			{
				code: 'intent_not_found',
				message:
					'This link can’t be used. Go back to where you started and try again.',
				data: { status: 404 },
			},
			'getIntent',
			[ 'example-intent', 'abc123' ]
		);
		registry
			.dispatch( CORE_INTENTS )
			.finishResolution( 'getIntent', [ 'example-intent', 'abc123' ] );
	},
};

export default {
	title: 'Components/Intents/IntentRenderer',
	component: IntentRenderer,
	parameters: { padding: 0 },
};
