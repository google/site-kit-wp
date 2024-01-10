/**
 * OfflineNotification component.
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
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { TYPE_WARNING } from '../SettingsNotice';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import SettingsNoticeSingleRow from '../SettingsNotice/SettingsNoticeSingleRow';
import { Button } from 'googlesitekit-components';
const { useSelect } = Data;

function OfflineNotification() {
	const [ dismissed, setDismissed ] = useState( false );

	const isOnline = useSelect( ( select ) => select( CORE_UI ).getIsOnline() );

	useEffect( () => {
		if ( isOnline && dismissed ) {
			setDismissed( false );
		}
	}, [ isOnline, dismissed ] );

	return (
		<div aria-live="polite">
			{ ! isOnline && ! dismissed && (
				<div
					className={ classnames(
						'googlesitekit-margin-top-0',
						'googlesitekit-margin-bottom-0',
						'googlesitekit-settings-notice-offline-notice',
						'googlesitekit-settings-notice',
						'googlesitekit-settings-notice--single-row',
						`googlesitekit-settings-notice--${ TYPE_WARNING }`
					) }
				>
					<div className="googlesitekit-settings-notice__body">
						<SettingsNoticeSingleRow
							notice={ __(
								'You are currently offline. Some features may not be available.',
								'google-site-kit'
							) }
						/>
					</div>
					<div className="googlesitekit-settings-notice__button">
						<Button
							onClick={ () => {
								setDismissed( true );
							} }
						>
							{ __( 'OK, Got it!', 'google-site-kit' ) }
						</Button>
					</div>
				</div>
			) }
		</div>
	);
}

export default OfflineNotification;
