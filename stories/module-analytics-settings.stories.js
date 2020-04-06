/**
 * Analytics Settings stories.
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
import { SettingsMain as AnalyticsSettings } from '../assets/js/modules/analytics/settings';
import { fillFilterWithComponent } from '../assets/js/util';
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';

import { STORE_NAME } from '../assets/js/modules/analytics/datastore';
import { WithTestRegistry } from '../tests/js/utils';

function filterAnalyticsSettings() {
	// set( global, 'googlesitekit.modules.analytics.setupComplete', true );
	removeAllFilters( 'googlesitekit.ModuleSettingsDetails-analytics' );
	addFilter(
		'googlesitekit.ModuleSettingsDetails-analytics',
		'googlesitekit.AnalyticsModuleSettings',
		fillFilterWithComponent( AnalyticsSettings )
	);
}

function Settings( props ) {
	const {
		callback,
		module = global.googlesitekit.modules.analytics,
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
					hasSettings={ true }
					autoActivate={ module.autoActivate }
					updateModulesList={ updateModulesList }
					handleEdit={ handleButtonAction }
					handleConfirm
					isEditing={ isEditing ? { 'analytics-module': true } : {} }
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

storiesOf( 'Analytics Module Settings', module )
	.add( 'View, closed', () => {
		filterAnalyticsSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveSettings( {} );
		};

		return <Settings isOpen={ false } callback={ setupRegistry } />;
	} )
	.add( 'View, open with all settings', () => {
		filterAnalyticsSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveSettings( {
				accountID: '1234567890',
				propertyID: 'UA-1234567890-1',
				profileID: '9999999',
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
		};

		return <Settings callback={ setupRegistry } />;
	} )
	.add( 'Edit, open with all settings', () => {
		filterAnalyticsSettings();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const { accountId, webPropertyId, id: profileID } = profiles[ 0 ];
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveAccounts( accounts );
			dispatch( STORE_NAME ).receiveProperties( properties );
			dispatch( STORE_NAME ).receiveProfiles( profiles );
			dispatch( STORE_NAME ).receiveSettings( {
				accountID: accountId,
				propertyID: webPropertyId,
				profileID,
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
		};

		return <Settings isEditing={ true } callback={ setupRegistry } />;
	} )
	.add( 'Edit, open with no accounts', () => {
		filterAnalyticsSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveSettings( {} );
			dispatch( STORE_NAME ).receiveAccounts( [] );
		};

		return <Settings isEditing={ true } callback={ setupRegistry } />;
	} )
	.add( 'Edit, with existing tag (with access)', () => {
		filterAnalyticsSettings();

		const { accounts, properties, profiles, matchedProperty } = fixtures.accountsPropertiesProfiles;
		const existingTag = {
			accountID: matchedProperty.accountId,
			propertyID: matchedProperty.id,
		};
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveExistingTag( existingTag );
			dispatch( STORE_NAME ).receiveAccounts( accounts );
			dispatch( STORE_NAME ).receiveProperties( properties );
			dispatch( STORE_NAME ).receiveProfiles( profiles );
			dispatch( STORE_NAME ).receiveSettings( {
				accountID: '12345',
				propertyID: 'UA-12345-1',
				profileID: '99999',
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
			dispatch( STORE_NAME ).receiveTagPermission( {
				...existingTag,
				permission: true,
			} );
		};

		return <Settings isEditing={ true } callback={ setupRegistry } />;
	} )
	.add( 'Edit, with existing tag (no access)', () => {
		filterAnalyticsSettings();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveSettings( {} );
			dispatch( STORE_NAME ).receiveAccounts( accounts );
			dispatch( STORE_NAME ).receiveProperties( properties );
			dispatch( STORE_NAME ).receiveProfiles( profiles );
			dispatch( STORE_NAME ).receiveExistingTag( {
				accountID: '12345678',
				propertyID: 'UA-12345678-1',
			} );
			dispatch( STORE_NAME ).receiveTagPermission( {
				accountID: '12345678',
				propertyID: 'UA-12345678-1',
				permission: false,
			} );
		};

		return <Settings isEditing={ true } callback={ setupRegistry } />;
	} )
;
