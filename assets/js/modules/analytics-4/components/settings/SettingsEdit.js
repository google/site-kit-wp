/**
 * Analytics 4 Settings Edit component.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { ACCOUNT_CREATE, MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import useExistingTagEffect from '../../hooks/useExistingTagEffect';
import SettingsForm from './SettingsForm';
import { AccountCreate, AccountCreateLegacy } from '../common';
const { useSelect } = Data;

export default function SettingsEdit() {
	const accounts =
		useSelect( ( select ) =>
			select( MODULES_ANALYTICS_4 ).getAccountSummaries()
		) || [];
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isDoingSubmitChanges()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getAccountSummaries'
		)
	);
	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const hasAnalytics4Access = useSelect( ( select ) => {
		const { hasModuleOwnershipOrAccess, getErrorForAction } =
			select( CORE_MODULES );

		const hasAccess = hasModuleOwnershipOrAccess( 'analytics-4' );

		if ( hasAccess ) {
			return true;
		}

		const checkAccessError = getErrorForAction( 'checkModuleAccess', [
			'analytics-4',
		] );

		// Return early if request is not completed yet.
		if ( undefined === hasAccess && ! checkAccessError ) {
			return undefined;
		}

		// Return false if GA4 is connected and access is concretely missing.
		if ( false === hasAccess ) {
			return false;
		}

		if ( 'module_not_connected' === checkAccessError?.code ) {
			return true;
		}

		// For any other error or case, the user does not have access to GA4.
		return false;
	} );

	useExistingTagEffect();

	const isCreateAccount = ACCOUNT_CREATE === accountID;

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if (
		isDoingSubmitChanges ||
		! hasResolvedAccounts ||
		hasAnalytics4Access === undefined
	) {
		viewComponent = <ProgressBar />;
	} else if ( ! accounts.length || isCreateAccount ) {
		viewComponent = usingProxy ? (
			<AccountCreate />
		) : (
			<AccountCreateLegacy />
		);
	} else {
		viewComponent = (
			<SettingsForm hasAnalytics4Access={ hasAnalytics4Access } />
		);
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			{ viewComponent }
		</div>
	);
}
