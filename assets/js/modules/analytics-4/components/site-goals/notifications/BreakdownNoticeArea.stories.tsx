/**
 * Site Goals BreakdownNoticeArea stories.
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
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	BREAKDOWN_ORIGIN_FORM_KEY,
	BREAKDOWN_ORIGIN_PANEL,
	BREAKDOWN_ORIGIN_WIDGET,
	BREAKDOWN_SCOPE_BOTH,
	BREAKDOWN_SCOPE_FORM_KEY,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ALL_CUSTOM_DIMENSIONS } from '@/js/modules/analytics-4/hooks/useBreakdownEnableHandler';
import { provideCustomDimensionError } from '@/js/modules/analytics-4/utils/custom-dimensions';
import { Story } from '@/js/types/Story';
import {
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import BreakdownNoticeArea from './BreakdownNoticeArea';

interface BreakdownNoticeAreaStoryProps {
	setupRegistry: ( registry: WPDataRegistry ) => void;
	origin?: string;
	goalTypes?: GoalType[];
}

function baseSetup(
	registry: WPDataRegistry,
	availableCustomDimensions: string[]
) {
	provideSiteInfo( registry );
	provideUserAuthentication( registry );
	provideUserCapabilities( registry );
	provideModules( registry, [
		{ slug: 'analytics-4', active: true, connected: true },
	] );
	registry
		.dispatch( CORE_USER )
		.receiveGetDismissedItems( [ SITE_GOALS_INTRO_MODAL_BANNER ] );
	registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
		widgetSlugs: [],
		isWidgetHidden: false,
	} );
	registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {} );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
		propertyID: '12345',
		availableCustomDimensions,
	} );
}

function Template( {
	setupRegistry,
	origin = BREAKDOWN_ORIGIN_WIDGET,
	goalTypes = [ GOAL_TYPES.LEAD ],
}: BreakdownNoticeAreaStoryProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div style={ { backgroundColor: 'white', padding: '20px' } }>
				<BreakdownNoticeArea
					origin={ origin }
					goalTypes={ goalTypes }
				/>
			</div>
		</WithRegistrySetup>
	);
}

export const New = Template.bind(
	{}
) as Story< BreakdownNoticeAreaStoryProps >;
New.storyName = 'New';
New.args = {
	setupRegistry: ( registry: WPDataRegistry ) => baseSetup( registry, [] ),
};

export const Loading = Template.bind(
	{}
) as Story< BreakdownNoticeAreaStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		baseSetup( registry, [] );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_WIDGET,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );
		fetchMock.post(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
			),
			() => new Promise( () => {} )
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.createCustomDimensions( ALL_CUSTOM_DIMENSIONS );
	},
};

export const Success = Template.bind(
	{}
) as Story< BreakdownNoticeAreaStoryProps >;
Success.storyName = 'Success';
Success.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		baseSetup( registry, ALL_CUSTOM_DIMENSIONS );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_WIDGET,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );
	},
};

export const GenericError = Template.bind(
	{}
) as Story< BreakdownNoticeAreaStoryProps >;
GenericError.storyName = 'Generic error';
GenericError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		baseSetup( registry, [] );
		provideCustomDimensionError( registry, {
			customDimension: ALL_CUSTOM_DIMENSIONS[ 0 ],
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );
	},
};

export const PermissionsError = Template.bind(
	{}
) as Story< BreakdownNoticeAreaStoryProps >;
PermissionsError.storyName = 'Insufficient permissions error';
PermissionsError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		baseSetup( registry, [] );
		provideCustomDimensionError( registry, {
			customDimension: ALL_CUSTOM_DIMENSIONS[ 0 ],
			error: {
				code: 'insufficient_permissions',
				message: 'Insufficient permissions',
				data: { status: 403, reason: 'insufficientPermissions' },
			},
		} );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );
	},
};

export const CombinedNew = Template.bind(
	{}
) as Story< BreakdownNoticeAreaStoryProps >;
CombinedNew.storyName = 'Combined New (Side Panel)';
CombinedNew.args = {
	origin: BREAKDOWN_ORIGIN_PANEL,
	goalTypes: [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ],
	setupRegistry: ( registry: WPDataRegistry ) => {
		baseSetup( registry, [] );
		provideSiteInfo( registry, {
			hasMultipleActiveEcommerceEventProviders: true,
		} );
	},
};

export const CombinedSuccess = Template.bind(
	{}
) as Story< BreakdownNoticeAreaStoryProps >;
CombinedSuccess.storyName = 'Combined success (Side Panel)';
CombinedSuccess.args = {
	origin: BREAKDOWN_ORIGIN_PANEL,
	goalTypes: [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ],
	setupRegistry: ( registry: WPDataRegistry ) => {
		baseSetup( registry, ALL_CUSTOM_DIMENSIONS );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_PANEL,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: BREAKDOWN_SCOPE_BOTH,
			} );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Notifications/BreakdownNoticeArea',
	component: BreakdownNoticeArea,
};
