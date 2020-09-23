/**
 * AdSense Settings stories.
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

import {
	SettingsMain as AdSenseSettings,
	SettingsSetupIncomplete,
} from '../assets/js/modules/adsense/components/settings';
import { fillFilterWithComponent } from '../assets/js/util';
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';

import { STORE_NAME } from '../assets/js/modules/adsense/datastore';
import {
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_ADDED,
} from '../assets/js/modules/adsense/util/status';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

function filterAdSenseSettings() {
	removeAllFilters( 'googlesitekit.ModuleSettingsDetails-adsense' );
	addFilter(
		'googlesitekit.ModuleSettingsDetails-adsense',
		'googlesitekit.AdSenseModuleSettings',
		fillFilterWithComponent( AdSenseSettings )
	);
}

function filterAdSenseSettingsSetupIncomplete() {
	removeAllFilters( 'googlesitekit.ModuleSetupIncomplete' );
	addFilter(
		'googlesitekit.ModuleSetupIncomplete',
		'googlesitekit.AdSenseModuleSettingsSetupIncomplete',
		fillFilterWithComponent( ( props ) => {
			const {
				slug,
				OriginalComponent,
			} = props;
			if ( 'adsense' !== slug ) {
				return <OriginalComponent { ...props } />;
			}
			return (
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
					<SettingsSetupIncomplete />
				</div>
			);
		} )
	);
}

const incompleteModuleData = {
	...global._googlesitekitLegacyData.modules.adsense,
	active: true,
	setupComplete: false,
};

const completeModuleData = {
	...global._googlesitekitLegacyData.modules.adsense,
	active: true,
	setupComplete: true,
};

const completeSettings = {
	accountID: fixtures.accounts[ 0 ].id,
	clientID: fixtures.clients[ 0 ].id,
	accountStatus: ACCOUNT_STATUS_APPROVED,
	siteStatus: SITE_STATUS_ADDED,
	useSnippet: true,
	accountSetupComplete: true,
	siteSetupComplete: true,
};

const Settings = createLegacySettingsWrapper( 'adsense', AdSenseSettings );

storiesOf( 'AdSense Module/Settings', module )
	.add( 'View, closed', () => {
		filterAdSenseSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
		};

		return <Settings isOpen={ false } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'View, open with setup incomplete', () => {
		filterAdSenseSettingsSetupIncomplete();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetSettings( {
				...completeSettings,
				accountStatus: ACCOUNT_STATUS_PENDING,
				accountSetupComplete: false,
				siteSetupComplete: false,
			} );
		};

		return <Settings module={ incompleteModuleData } callback={ setupRegistry } />;
	} )
	.add( 'View, open with all settings', () => {
		filterAdSenseSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetSettings( completeSettings );
		};

		return <Settings module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, open', () => {
		filterAdSenseSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetSettings( completeSettings );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, open with existing tag (same account)', () => {
		filterAdSenseSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( completeSettings.clientID );
			dispatch( STORE_NAME ).receiveGetSettings( completeSettings );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, open with existing tag (different account)', () => {
		filterAdSenseSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( 'ca-pub-12345678' );
			dispatch( STORE_NAME ).receiveGetSettings( completeSettings );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
;
