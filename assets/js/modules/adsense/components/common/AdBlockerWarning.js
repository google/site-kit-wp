/**
 * AdSense AdBlockerWarning component.
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
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ErrorIcon from '../../../../../svg/error.svg';

import { STORE_NAME } from '../../datastore/constants';
const { useSelect } = Data;

export default function AdBlockerWarning( { context } ) {
	const isAdBlockerActive = useSelect( ( select ) => select( STORE_NAME ).isAdBlockerActive() );
	const isAccountSetupComplete = useSelect( ( select ) => select( STORE_NAME ).getAccountSetupComplete() );
	const isSiteSetupComplete = useSelect( ( select ) => select( STORE_NAME ).getSiteSetupComplete() );

	// Return nothing if loading or if everything is fine.
	if ( ! isAdBlockerActive ) {
		return null;
	}

	let message;
	if ( isAccountSetupComplete && isSiteSetupComplete ) {
		message = __( 'Ad blocker detected, you need to disable it to get the AdSense latest data.', 'google-site-kit' );
	} else {
		message = __( 'Ad blocker detected, you need to disable it in order to set up AdSense.', 'google-site-kit' );
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-module-warning',
				{ [ `googlesitekit-settings-module-warning--${ context }` ]: context }
			) }
		>
			<ErrorIcon height="20" width="23" /> { message }
		</div>
	);
}

AdBlockerWarning.propTypes = {
	context: PropTypes.string,
};

AdBlockerWarning.defaultProps = {
	context: '',
};
