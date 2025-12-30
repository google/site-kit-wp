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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { useFeature } from '@/js/hooks/useFeature';
import { ProgressBar } from 'googlesitekit-components';
import {
	ACCOUNT_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useExistingTagEffect from '@/js/modules/analytics-4/hooks/useExistingTagEffect';
import SettingsForm from './SettingsForm';
import {
	AccountCreate,
	AccountCreateLegacy,
} from '@/js/modules/analytics-4/components/common';

export default function SettingsEdit() {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

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

	const hasModuleAccess = useSelect( ( select ) => {
		const { hasModuleOwnershipOrAccess, getErrorForAction } =
			select( CORE_MODULES );

		const hasAccess = hasModuleOwnershipOrAccess( MODULE_SLUG_ANALYTICS_4 );

		if ( hasAccess ) {
			return true;
		}

		const checkAccessError = getErrorForAction( 'checkModuleAccess', [
			MODULE_SLUG_ANALYTICS_4,
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
		hasModuleAccess === undefined
	) {
		viewComponent = <ProgressBar />;
	} else if ( ! accounts.length || isCreateAccount ) {
		viewComponent = usingProxy ? (
			<AccountCreate />
		) : (
			<AccountCreateLegacy />
		);
	} else {
		viewComponent = <SettingsForm hasModuleAccess={ hasModuleAccess } />;
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-setup-module googlesitekit-setup-module--analytics',
				{
					'googlesitekit-feature--setupFlowRefresh':
						setupFlowRefreshEnabled,
				}
			) }
		>
			{ viewComponent }
		</div>
	);
}
