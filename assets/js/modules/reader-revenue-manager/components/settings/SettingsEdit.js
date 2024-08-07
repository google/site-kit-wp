/**
 * Reader Revenue Manager SettingsEdit component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { PublicationOnboardingStateNotice, PublicationSelect } from '../common';

export default function SettingsEdit() {
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges()
	);

	const hasModuleAccess = useSelect( ( select ) => {
		const { hasModuleOwnershipOrAccess, getErrorForAction } =
			select( CORE_MODULES );

		const hasAccess = hasModuleOwnershipOrAccess(
			READER_REVENUE_MANAGER_MODULE_SLUG
		);

		if ( hasAccess ) {
			return true;
		}

		const checkAccessError = getErrorForAction( 'checkModuleAccess', [
			READER_REVENUE_MANAGER_MODULE_SLUG,
		] );

		// Return early if request is not completed yet.
		if ( undefined === hasAccess && ! checkAccessError ) {
			return undefined;
		}

		// Return false if RRM is connected and access is concretely missing.
		if ( false === hasAccess ) {
			return false;
		}

		if ( 'module_not_connected' === checkAccessError?.code ) {
			return true;
		}

		return false;
	} );

	if ( isDoingSubmitChanges || undefined === hasModuleAccess ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--reader-revenue-manager">
			{ hasModuleAccess && (
				<Fragment>
					<PublicationSelect hasModuleAccess={ hasModuleAccess } />
					<PublicationOnboardingStateNotice />
				</Fragment>
			) }
		</div>
	);
}
