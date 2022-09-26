/**
 * Analytics Settings Edit component.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS, ACCOUNT_CREATE } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import useExistingTagEffect from '../../hooks/useExistingTagEffect';
import useExistingGA4TagEffect from '../../../analytics-4/hooks/useExistingTagEffect';
import SettingsForm from './SettingsForm';
import ProgressBar from '../../../../components/ProgressBar';
import { AccountCreate, AccountCreateLegacy } from '../common';
const { useSelect } = Data;

export default function SettingsEdit() {
	const accounts =
		useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccounts() ) ||
		[];
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isDoingSubmitChanges()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasFinishedResolution( 'getAccounts' )
	);
	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const loggedInUserID = useSelect( ( select ) =>
		select( CORE_USER ).getID()
	);
	const hasResolvedUser = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getUser' )
	);

	const hasAnalyticsAccess = useSelect( ( select ) => {
		const moduleOwnerID = select( MODULES_ANALYTICS ).getOwnerID();

		if ( moduleOwnerID === loggedInUserID ) {
			return true;
		}
		return select( CORE_MODULES ).hasModuleAccess( 'analytics' );
	} );
	const isLoadingAnalyticsAccess = useSelect( ( select ) => {
		const hasResolvedModuleOwner =
			select( MODULES_ANALYTICS ).hasFinishedResolution( 'getSettings' );

		const isResolvingModuleAccess = select( CORE_MODULES ).isResolving(
			'hasModuleAccess',
			[ 'analytics' ]
		);

		return (
			! hasResolvedModuleOwner ||
			! hasResolvedUser ||
			isResolvingModuleAccess
		);
	} );

	const hasAnalytics4Access = useSelect( ( select ) => {
		const moduleOwnerID = select( MODULES_ANALYTICS_4 ).getOwnerID();

		if ( moduleOwnerID === loggedInUserID ) {
			return true;
		}
		return select( CORE_MODULES ).hasModuleAccess( 'analytics-4' );
	} );
	const isLoadingAnalytics4Access = useSelect( ( select ) => {
		const hasResolvedModuleOwner =
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getSettings'
			);

		const isResolvingModuleAccess = select( CORE_MODULES ).isResolving(
			'hasModuleAccess',
			[ 'analytics-4' ]
		);

		return (
			! hasResolvedModuleOwner ||
			! hasResolvedUser ||
			isResolvingModuleAccess
		);
	} );

	useExistingTagEffect();
	useExistingGA4TagEffect();

	const isCreateAccount = ACCOUNT_CREATE === accountID;

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if (
		isDoingSubmitChanges ||
		! hasResolvedAccounts ||
		isLoadingAnalyticsAccess ||
		isLoadingAnalytics4Access
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
			<SettingsForm
				hasAnalyticsAccess={ hasAnalyticsAccess }
				hasAnalytics4Access={ hasAnalytics4Access }
			/>
		);
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			{ viewComponent }
		</div>
	);
}
