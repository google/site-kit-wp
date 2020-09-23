/**
 * PageSpeed Insights Settings stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { removeAllFilters, addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { SettingsMain as PageSpeedInsightsSettings } from '../assets/js/modules/pagespeed-insights/components/settings';
import { fillFilterWithComponent } from '../assets/js/util';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

function filterPageSpeedInsightsSettings() {
	removeAllFilters( 'googlesitekit.ModuleSettingsDetails-pagespeed-insights' );
	addFilter(
		'googlesitekit.ModuleSettingsDetails-pagespeed-insights',
		'googlesitekit.PageSpeedInsightsModuleSettingsDetails',
		fillFilterWithComponent( PageSpeedInsightsSettings )
	);
}

const completeModuleData = {
	...global._googlesitekitLegacyData.modules[ 'pagespeed-insights' ],
	active: true,
	setupComplete: true,
};

const Settings = createLegacySettingsWrapper( 'pagespeed-insights', PageSpeedInsightsSettings );

storiesOf( 'PageSpeed Insights Module/Settings', module )
	.add( 'View, closed', () => {
		filterPageSpeedInsightsSettings();

		return <Settings isOpen={ false } module={ completeModuleData } />;
	} )
	.add( 'View, open with all settings', () => {
		filterPageSpeedInsightsSettings();

		return <Settings module={ completeModuleData } />;
	} )
	.add( 'Edit, open with all settings', () => {
		filterPageSpeedInsightsSettings();

		return <Settings isEditing={ true } module={ completeModuleData } />;
	} )
;
