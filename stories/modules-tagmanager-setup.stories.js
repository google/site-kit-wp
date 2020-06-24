/**
 * Tag Manager Module Setup Stories.
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
import { WithTestRegistry } from '../tests/js/utils';
import { fillFilterWithComponent } from '../assets/js/util';
import SetupWrapper from '../assets/js/components/setup/setup-wrapper';
import { STORE_NAME } from '../assets/js/modules/tagmanager/datastore';
import { SetupMain as TagManagerSetup } from '../assets/js/modules/tagmanager/components/setup';
import fetchMock from 'fetch-mock';
import * as fixtures from '../assets/js/modules/tagmanager/datastore/__fixtures__';

function Setup( props ) {
	global._googlesitekitLegacyData.setup.moduleToSetup = 'tagmanager';

	removeAllFilters( 'googlesitekit.ModuleSetup-tagmanager' );
	addFilter(
		'googlesitekit.ModuleSetup-tagmanager',
		'googlesitekit.TagManagerModuleSetup',
		fillFilterWithComponent( TagManagerSetup )
	);

	return (
		<WithTestRegistry { ...props }>
			<SetupWrapper />
		</WithTestRegistry>
	);
}

storiesOf( 'Tag Manager Module/Setup', module )
	.add( 'Loading', () => {
		const setupRegistry = ( { dispatch } ) => {
			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/,
				new Promise( () => {} )
			);
			dispatch( STORE_NAME ).setSettings( {} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};
		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Start', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setSettings( {} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
			dispatch( STORE_NAME ).receiveGetContainers( fixtures.getContainers.all, { accountID: fixtures.accounts[ 0 ].accountId } );
		};
		return <Setup callback={ setupRegistry } />;
	} )
;
