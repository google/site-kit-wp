/**
 * DashboardSharingSettings Footer component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../../Link';
import Button from '../../Button';
import Notice from './Notice';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

export default function Footer( { closeDialog } ) {
	const canSubmitSharingChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).canSubmitSharingChanges()
	);
	const onApply = useCallback( () => {
		// @TODO: Implement Apply behaviour.
	}, [] );

	return (
		<div className="googlesitekit-dashboard-sharing-settings__footer">
			<div className="googlesitekit-dashboard-sharing-settings__footer-notice">
				<Notice />
			</div>

			<div className="googlesitekit-dashboard-sharing-settings__footer-actions">
				<Link onClick={ closeDialog }>
					{ __( 'Cancel', 'google-site-kit' ) }
				</Link>

				<Button
					onClick={ onApply }
					disabled={ ! canSubmitSharingChanges }
				>
					{ __( 'Apply', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}

Footer.propTypes = {
	closeDialog: PropTypes.func.isRequired,
};
