/**
 * Analytics Main setup component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { Fragment, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';
import SetupForm from './SetupForm';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	MODULES_ANALYTICS_4,
	ACCOUNT_CREATE,
} from '@/js/modules/analytics-4/datastore/constants';
import useExistingTagEffect from '@/js/modules/analytics-4/hooks/useExistingTagEffect';
import {
	AccountCreate,
	AccountCreateLegacy,
} from '@/js/modules/analytics-4/components/common';
import ToastNotice from '@/js/components/ToastNotice';
import Typography from '@/js/components/Typography';
import useQueryArg from '@/js/hooks/useQueryArg';
import { useFeature } from '@/js/hooks/useFeature';

export default function SetupMain( { finishSetup } ) {
	const accounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountSummaries()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getAccountSummaries'
		)
	);
	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const { setAccountID } = useDispatch( MODULES_ANALYTICS_4 );
	const { findMatchedAccount, matchAndSelectProperty } =
		useDispatch( MODULES_ANALYTICS_4 );
	const [ isMatchedAccount, setIsMatchedAccount ] = useState( false );
	useEffect( () => {
		if ( ! accounts ) {
			return;
		}

		async function fetchMatchedAccount() {
			setIsMatchedAccount( true );
			const matchedAccount = await findMatchedAccount();
			setIsMatchedAccount( false );
			if ( matchedAccount ) {
				setAccountID( matchedAccount._id );
				matchAndSelectProperty( matchedAccount._id );
			}
		}

		if ( ! accountID ) {
			fetchMatchedAccount();
		}
	}, [
		findMatchedAccount,
		accounts,
		setAccountID,
		accountID,
		matchAndSelectProperty,
	] );

	// Set the accountID and containerID if there is an existing tag.
	useExistingTagEffect();

	const isCreateAccount = ACCOUNT_CREATE === accountID;

	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

	const [ searchConsoleSetupSuccess, setSearchConsoleSetupSuccess ] =
		useQueryArg( 'searchConsoleSetupSuccess' );

	const showSearchConsoleSetupSuccessToast =
		!! searchConsoleSetupSuccess && setupFlowRefreshEnabled;

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if ( ! hasResolvedAccounts || isMatchedAccount ) {
		viewComponent = <ProgressBar />;
	} else if (
		isCreateAccount ||
		( Array.isArray( accounts ) && ! accounts.length )
	) {
		viewComponent = usingProxy ? (
			<AccountCreate />
		) : (
			<AccountCreateLegacy />
		);
	} else {
		viewComponent = <SetupForm finishSetup={ finishSetup } />;
	}

	return (
		<Fragment>
			<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
				<div className="googlesitekit-setup-module__step">
					<div className="googlesitekit-setup-module__logo">
						<AnalyticsIcon width="40" height="40" />
					</div>

					<Typography
						as="h3"
						className="googlesitekit-setup-module__title"
						size="small"
						type="headline"
					>
						{ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					</Typography>
				</div>
				<div className="googlesitekit-setup-module__step">
					{ viewComponent }
				</div>
			</div>
			{ showSearchConsoleSetupSuccessToast && (
				<ToastNotice
					title="Search Console was successfully set up"
					onDismiss={ () =>
						setSearchConsoleSetupSuccess( undefined )
					}
				/>
			) }
		</Fragment>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
