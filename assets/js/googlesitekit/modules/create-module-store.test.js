/**
 * Module datastore functions tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { createNotificationsStore } from '../data/create-notifications-store';
import { createSettingsStore } from '../data/create-settings-store';
import { createInfoStore } from './create-info-store';
import { createModuleStore } from './create-module-store';
import { createSubmitChangesStore } from './create-submit-changes-store';

const SETTING_SLUG = 'testSetting';
const MODULE_SLUG = 'base';
const TEST_STORE_NAME = `test/${ MODULE_SLUG }`;

describe( 'createModuleStore store', () => {
	const settingSlugs = [ SETTING_SLUG ];

	let registry;
	let storeDefinition;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createModuleStore( MODULE_SLUG, {
			storeName: TEST_STORE_NAME,
			settingSlugs,
		} );

		registry.registerStore( storeDefinition.STORE_NAME, storeDefinition );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'name', () => {
		it( 'returns the correct default store name', () => {
			expect( storeDefinition.STORE_NAME ).toEqual( TEST_STORE_NAME );
		} );
	} );

	describe( 'actions', () => {
		it.each( [
			[
				'createNotificationsStore',
				createNotificationsStore(
					'modules',
					MODULE_SLUG,
					'notifications'
				),
			],
			[
				'createSettingsStore',
				createSettingsStore( 'modules', MODULE_SLUG, 'settings', {
					settingSlugs,
					registry,
				} ),
			],
			[ 'createSubmitChangesStore', createSubmitChangesStore() ],
		] )(
			'includes all actions from %s store',
			( partialStoreName, partialStore ) => {
				expect( Object.keys( storeDefinition.actions ) ).toEqual(
					expect.arrayContaining(
						Object.keys( partialStore.actions )
					)
				);
			}
		);
	} );

	describe( 'selectors', () => {
		it.each( [
			[
				'createInfoStore',
				createInfoStore( MODULE_SLUG, { storeName: TEST_STORE_NAME } ),
			],
			[
				'createNotificationsStore',
				createNotificationsStore(
					'modules',
					MODULE_SLUG,
					'notifications'
				),
			],
			[
				'createSettingsStore',
				createSettingsStore( 'modules', MODULE_SLUG, 'settings', {
					settingSlugs,
					registry,
				} ),
			],
			[ 'createSubmitChangesStore', createSubmitChangesStore() ],
		] )(
			'includes all actions from %s store',
			( partialStoreName, partialStore ) => {
				expect( Object.keys( storeDefinition.selectors ) ).toEqual(
					expect.arrayContaining(
						Object.keys( partialStore.selectors )
					)
				);
			}
		);
	} );
} );
