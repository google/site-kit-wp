/**
 * Site Goals conversion tracking disabled notice stories.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { seedSiteGoalsBreakdownValuesReport } from '@/js/modules/analytics-4/components/site-goals/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import { provideModules, provideUserCapabilities } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import ConversionTrackingDisabledNotice from './ConversionTrackingDisabledNotice';

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsSiteGoalsConversionTrackingDisabledNotice'
)( ConversionTrackingDisabledNotice );

interface TemplateProps {
	/** Whether the user can manage options, and so gets the "Enable tracking" button. */
	canManageOptions: boolean;
}

function Template( { canManageOptions }: TemplateProps ) {
	function setupRegistry( registry: WPDataRegistry ) {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: canManageOptions,
		} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

		// Conversion tracking is off, while the lead generation widget shows
		// breakdown tabs from the data collected before.
		registry
			.dispatch( CORE_SITE )
			.receiveGetConversionTrackingSettings( { enabled: false } );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
			availableCustomDimensions: [
				'googlesitekit_event_provider',
				'googlesitekit_form_id',
			],
			detectedEvents: [ 'purchase', 'contact' ],
		} );
		seedSiteGoalsBreakdownValuesReport(
			registry,
			GOAL_TYPES.ECOMMERCE,
			[]
		);
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.LEAD, [
			'5',
		] );
	}

	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps />
		</WithRegistrySetup>
	);
}

export const Admin = Template.bind( {} ) as Story< TemplateProps >;
Admin.storyName = 'Admin';
Admin.args = {
	canManageOptions: true,
};
Admin.scenario = {};

export const ViewOnly = Template.bind( {} ) as Story< TemplateProps >;
ViewOnly.storyName = 'View-only';
ViewOnly.args = {
	canManageOptions: false,
};
ViewOnly.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/ConversionTrackingDisabledNotice',
	component: ConversionTrackingDisabledNotice,
};
