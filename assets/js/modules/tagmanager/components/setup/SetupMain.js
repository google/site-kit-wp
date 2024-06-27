/**
 * Tag Manager Main setup component.
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
import { useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import TagManagerIcon from '../../../../../svg/graphics/tagmanager.svg';
import SetupForm from './SetupForm';
import { MODULES_TAGMANAGER, ACCOUNT_CREATE } from '../../datastore/constants';
import useExistingTagEffect from '../../hooks/useExistingTagEffect';
import { AccountCreate } from '../common';

export default function SetupMain( { finishSetup } ) {
	const accounts = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccounts()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccountID()
	);
	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasExistingTag()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasFinishedResolution( 'getAccounts' )
	);
	const isCreateAccount = ACCOUNT_CREATE === accountID;

	// Set useSnippet to `false` if there is an existing tag and it is the same as the selected container ID.
	useExistingTagEffect();

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if ( ! hasResolvedAccounts || hasExistingTag === undefined ) {
		viewComponent = <ProgressBar />;
	} else if ( isCreateAccount || ! accounts?.length ) {
		viewComponent = <AccountCreate />;
	} else {
		viewComponent = <SetupForm finishSetup={ finishSetup } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--tagmanager">
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<TagManagerIcon width="40" height="40" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x( 'Tag Manager', 'Service name', 'google-site-kit' ) }
				</h2>
			</div>
			<div className="googlesitekit-setup-module__step">
				{ viewComponent }
			</div>
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
