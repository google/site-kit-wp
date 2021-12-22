/**
 * Analytics Main setup component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AnalyticsIcon from '../../../../../svg/graphics/analytics.svg';
import SetupForm from './SetupForm';
import ProgressBar from '../../../../components/ProgressBar';
import { MODULES_ANALYTICS, ACCOUNT_CREATE } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import useExistingTagEffect from '../../hooks/useExistingTagEffect';
import {
	AccountCreate,
	AccountCreateLegacy,
	ExistingTagError,
	ExistingGTMPropertyError,
} from '../common';
const { useSelect } = Data;

export default function SetupMain( { finishSetup } ) {
	const accounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccounts()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasExistingTag()
	);
	const hasExistingTagPermission = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasExistingTagPermission()
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
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const setupFlowMode = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getSetupFlowMode()
	);

	const {
		hasGTMAnalyticsPropertyID,
		hasGTMAnalyticsPropertyIDPermission,
	} = useSelect( ( select ) => {
		const gtmPropertyID = select(
			MODULES_TAGMANAGER
		).getSingleAnalyticsPropertyID();
		return {
			hasGTMAnalyticsPropertyID: !! gtmPropertyID,
			hasGTMAnalyticsPropertyIDPermission: gtmPropertyID
				? select( MODULES_ANALYTICS ).hasTagPermission( gtmPropertyID )
				: false,
		};
	} );

	// Set the accountID and containerID if there is an existing tag.
	useExistingTagEffect();

	const isCreateAccount = ACCOUNT_CREATE === accountID;

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if (
		isDoingSubmitChanges ||
		! hasResolvedAccounts ||
		isNavigating ||
		setupFlowMode === undefined
	) {
		viewComponent = <ProgressBar />;
	} else if ( hasExistingTag && hasExistingTagPermission === false ) {
		viewComponent = <ExistingTagError />;
	} else if (
		hasGTMAnalyticsPropertyID &&
		! hasGTMAnalyticsPropertyIDPermission
	) {
		viewComponent = <ExistingGTMPropertyError />;
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
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<div className="googlesitekit-setup-module__logo">
				<AnalyticsIcon width="33" height="33" />
			</div>

			<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
				{ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			</h2>

			{ viewComponent }
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
