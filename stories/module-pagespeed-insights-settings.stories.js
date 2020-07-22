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
import SettingsModule from '../assets/js/components/settings/settings-module';
import { SettingsMain as PageSpeedInsightsSettings } from '../assets/js/modules/pagespeed-insights/components/settings';
import { fillFilterWithComponent } from '../assets/js/util';
import { WithTestRegistry } from '../tests/js/utils';

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

function Settings( props ) {
	const {
		callback,
		module = global._googlesitekitLegacyData.modules[ 'pagespeed-insights' ],
		isEditing = false,
		isOpen = true,
		isSaving = false,
		error = false,
		// eslint-disable-next-line no-console
		handleAccordion = ( ...args ) => console.log( 'handleAccordion', ...args ),
		// eslint-disable-next-line no-console
		handleDialog = ( ...args ) => console.log( 'handleDialog', ...args ),
		// eslint-disable-next-line no-console
		updateModulesList = ( ...args ) => console.log( 'updateModulesList', ...args ),
		// eslint-disable-next-line no-console
		handleButtonAction = ( ...args ) => console.log( 'handleButtonAction', ...args ),
	} = props;

	return (
		<WithTestRegistry callback={ callback }>
			<div style={ { background: 'white' } }>
				<SettingsModule
					key={ module.slug + '-module' }
					slug={ module.slug }
					name={ module.name }
					description={ module.description }
					homepage={ module.homepage }
					learnmore={ module.learnMore }
					active={ module.active }
					setupComplete={ module.setupComplete }
					hasSettings={ false }
					autoActivate={ module.autoActivate }
					updateModulesList={ updateModulesList }
					handleEdit={ handleButtonAction }
					handleConfirm
					isEditing={ isEditing ? { 'pagespeed-insights-module': true } : {} }
					isOpen={ isOpen }
					handleAccordion={ handleAccordion }
					handleDialog={ handleDialog }
					provides={ module.provides }
					isSaving={ isSaving }
					screenID={ module.screenID }
					error={ error }
				/>
			</div>
		</WithTestRegistry>
	);
}

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
