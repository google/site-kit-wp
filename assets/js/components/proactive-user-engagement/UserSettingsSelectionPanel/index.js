/**
 * User Settings Selection Panel (container around SelectionPanel)
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/proactive-user-engagement/constants';
import SelectionPanel from '@/js/components/SelectionPanel';
import PanelContent from './PanelContent';

export default function UserSettingsSelectionPanel() {
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
	);

	const settings = useSelect( ( select ) => {
		if ( ! isOpen ) {
			return {};
		}

		return select( CORE_USER ).getProactiveUserEngagementSettings();
	} );
	const isSavingSettings = useSelect( ( select ) => {
		if ( ! isOpen ) {
			return false;
		}

		return select( CORE_USER ).isSavingProactiveUserEngagementSettings();
	} );

	const { setValue } = useDispatch( CORE_UI );

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, false );
		}
	}, [ isOpen, setValue ] );

	const [ notice, setNotice ] = useState( null );

	const { saveProactiveUserEngagementSettings } = useDispatch( CORE_USER );

	const onSaveCallback = useCallback( async () => {
		const { error } = await saveProactiveUserEngagementSettings();

		if ( ! error ) {
			setNotice( {
				type: 'success',
				text: __(
					'You’ve successfully updated frequency settings!',
					'google-site-kit'
				),
			} );
		} else {
			setNotice( {
				type: 'error',
				text:
					error?.message ||
					__( 'An error occurred.', 'google-site-kit' ),
			} );
		}
	}, [ saveProactiveUserEngagementSettings ] );

	const onSubscribe = useCallback( async () => {
		const { error } = await saveProactiveUserEngagementSettings( {
			subscribed: true,
		} );

		if ( ! error ) {
			setNotice( {
				type: 'success',
				text: __(
					'You’ve successfully subscribed to email reports!',
					'google-site-kit'
				),
			} );
		} else {
			setNotice( {
				type: 'error',
				text:
					error?.message ||
					__( 'An error occurred.', 'google-site-kit' ),
			} );
		}
	}, [ saveProactiveUserEngagementSettings ] );

	const onUnsubscribe = useCallback( async () => {
		const { error } = await saveProactiveUserEngagementSettings( {
			subscribed: false,
		} );

		if ( ! error ) {
			setNotice( {
				type: 'info',
				text: __(
					'You’ve unsubscribed from email reports',
					'google-site-kit'
				),
			} );
		} else {
			setNotice( {
				type: 'error',
				text:
					error?.message ||
					__( 'An error occurred.', 'google-site-kit' ),
			} );
		}
	}, [ saveProactiveUserEngagementSettings ] );

	const onNoticeDismiss = useCallback( () => setNotice( null ), [] );

	return (
		<SelectionPanel
			className="googlesitekit-user-settings-selection-panel"
			isOpen={ !! isOpen }
			closePanel={ closePanel }
		>
			<PanelContent
				notice={ notice }
				isUserSubscribed={ settings?.subscribed }
				isSavingSettings={ isSavingSettings }
				onSaveCallback={ onSaveCallback }
				onSubscribe={ onSubscribe }
				onUnsubscribe={ onUnsubscribe }
				onNoticeDismiss={ onNoticeDismiss }
				closePanel={ closePanel }
			/>
		</SelectionPanel>
	);
}
