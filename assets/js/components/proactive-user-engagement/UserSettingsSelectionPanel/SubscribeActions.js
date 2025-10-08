/**
 * SubscribeActions component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SpinnerButton from '@/js/googlesitekit/components-gm2/SpinnerButton';

const ACTION_TYPE = {
	SUBSCRIBE: 'subscribe',
	UNSUBSCRIBE: 'unsubscribe',
	UPDATE_SETTINGS: 'update_settings',
};

export default function SubscribeActions( {
	isSubscribed,
	onSubscribe,
	onUnsubscribe,
	updateSettings,
	isLoading,
} ) {
	const [ actionType, setActionType ] = useState( '' );

	function handleClick( action ) {
		setActionType( action );

		switch ( action ) {
			case ACTION_TYPE.UPDATE_SETTINGS:
				updateSettings();
				break;
			case ACTION_TYPE.SUBSCRIBE:
				onSubscribe();
				break;
			case ACTION_TYPE.UNSUBSCRIBE:
				onUnsubscribe();
				break;
			default:
				break;
		}
	}

	return (
		<div className="googlesitekit-selection-panel-subscribe-actions">
			{ isSubscribed && (
				<SpinnerButton
					onClick={ () => handleClick( ACTION_TYPE.UNSUBSCRIBE ) }
					isSaving={
						isLoading && actionType === ACTION_TYPE.UNSUBSCRIBE
					}
					disabled={ isLoading }
					tertiary
				>
					{ __( 'Unsubscribe', 'google-site-kit' ) }
				</SpinnerButton>
			) }
			<SpinnerButton
				onClick={ () =>
					handleClick(
						isSubscribed
							? ACTION_TYPE.UPDATE_SETTINGS
							: ACTION_TYPE.SUBSCRIBE
					)
				}
				isSaving={ isLoading && actionType !== ACTION_TYPE.UNSUBSCRIBE }
				disabled={ isLoading }
			>
				{ isSubscribed
					? __( 'Update Settings', 'google-site-kit' )
					: __( 'Subscribe', 'google-site-kit' ) }
			</SpinnerButton>
		</div>
	);
}

SubscribeActions.propTypes = {
	isSubscribed: PropTypes.bool,
	onSubscribe: PropTypes.func.isRequired,
	onUnsubscribe: PropTypes.func.isRequired,
	updateSettings: PropTypes.func.isRequired,
	isLoading: PropTypes.bool,
};
