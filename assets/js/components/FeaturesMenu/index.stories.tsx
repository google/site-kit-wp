/**
 * FeaturesMenu stories.
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
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import DateRangeSelector from '@/js/components/DateRangeSelector';
import Header from '@/js/components/Header';
import HelpMenu from '@/js/components/help/HelpMenu';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
	PERMISSION_READ_SHARED_MODULE_DATA,
	PERMISSION_VIEW_SHARED_DASHBOARD,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteConnection,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeaturesMenu from '.';

function Template( {
	setupRegistry = () => {},
	viewContext = VIEW_CONTEXT_MAIN_DASHBOARD,
}: {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
	viewContext?: string;
} ) {
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => {
				provideSiteInfo( registry );
				setupRegistry( registry );
			} }
		>
			<ViewContextProvider value={ viewContext }>
				<Header>
					<DateRangeSelector />
					<HelpMenu />
					<FeaturesMenu />
				</Header>
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} ) as Story & {
	parameters?: Record< string, unknown >;
};
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideUserAuthentication( registry );
	},
};
Default.parameters = {
	features: [ 'pdfGeneration' ],
};
Default.scenario = {
	delay: 3000,
	clickSelector: '.googlesitekit-features-menu__button',
	postInteractionWait: 3000,
	onReadyScript: 'mouse.js',
};

export const WithoutPDFGeneration = Template.bind( {} ) as Story;
WithoutPDFGeneration.storyName = 'Without PDF Generation';
WithoutPDFGeneration.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideUserAuthentication( registry );
	},
};
WithoutPDFGeneration.scenario = {
	delay: 3000,
	clickSelector: '.googlesitekit-features-menu__button',
	postInteractionWait: 3000,
	onReadyScript: 'mouse.js',
};

export const ViewOnly = Template.bind( {} ) as Story & {
	parameters?: Record< string, unknown >;
};
ViewOnly.storyName = 'View Only';
ViewOnly.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideSiteConnection( registry );
		provideModules( registry, [
			{ slug: MODULE_SLUG_SEARCH_CONSOLE, shareable: true },
			{ slug: MODULE_SLUG_ANALYTICS_4, shareable: true },
		] );
		provideModuleRegistrations( registry );
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: false,
			[ PERMISSION_VIEW_SHARED_DASHBOARD ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
		} );

		registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: false } );

		// Mock the tracking endpoint to allow checking/unchecking the tracking checkbox.
		fetchMock.post(
			RegExp( 'google-site-kit/v1/core/user/data/tracking' ),
			( url: string, { body }: { body: string } ) => {
				const { data } = JSON.parse( body );

				return { body: data };
			}
		);
	},
};
ViewOnly.parameters = {
	features: [ 'pdfGeneration' ],
};
ViewOnly.scenario = {
	delay: 3000,
	clickSelector: '.googlesitekit-features-menu__button',
	postInteractionWait: 3000,
	onReadyScript: 'mouse.js',
};

export default {
	title: 'Components/FeaturesMenu',
	component: FeaturesMenu,
	parameters: { padding: 0 },
};
