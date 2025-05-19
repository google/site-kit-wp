/**
 * Reader Revenue Manager pluign registration.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { registerPlugin } from '@wordpress-core/plugins';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../js/googlesitekit/datastore/user/constants';
import { CORE_EDIT_SITE } from '../common/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../../js/modules/reader-revenue-manager/datastore/constants';
import SettingPanel from './SettingPanel';

const { select, resolveSelect } = Data;

export async function registerReaderRevenueManagerPlugin() {
	// Only allow the plugin to be registered in the post editor.
	const isSiteEditor = !! select( CORE_EDIT_SITE );

	if ( isSiteEditor ) {
		return;
	}

	await Promise.all( [
		resolveSelect( CORE_MODULES ).getModules(),
		resolveSelect( CORE_USER ).getUser(),
		resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings(),
	] );

	const isRRMConnected = select( CORE_MODULES ).isModuleConnected(
		'reader-revenue-manager'
	);

	if ( ! isRRMConnected ) {
		return;
	}

	let hasModuleOwnershipOrAccess = select( CORE_MODULES ).hasModuleOwnership(
		'reader-revenue-manager'
	);

	if ( hasModuleOwnershipOrAccess === false ) {
		hasModuleOwnershipOrAccess = await resolveSelect(
			CORE_MODULES
		).hasModuleAccess( 'reader-revenue-manager' );
	}

	if ( ! hasModuleOwnershipOrAccess ) {
		return null;
	}

	registerPlugin( 'googlesitekit-rrm-plugin', {
		render: SettingPanel,
	} );
}
