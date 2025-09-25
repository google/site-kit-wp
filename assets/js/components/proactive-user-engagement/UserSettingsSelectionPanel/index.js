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
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/proactive-user-engagement/constants';
import SelectionPanel from '@/js/components/SelectionPanel';
import PanelContent from './PanelContent';

// @TODO remove eslint disable rule
/* eslint-disable */
export default function UserSettingsSelectionPanel() {
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
	);

	const { setValue } = useDispatch( CORE_UI );

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, false );
		}
	}, [ isOpen, setValue ] );

	const [ notice, setNotice ] = useState( null );

	const onOpen = useCallback( () => {
		// TODO: Fetch settings only when opened if needed.
		// select( CORE_USER ).getProactiveUserEngagementSettings();
	}, [] );

	const onSaveCallback = useCallback(
		async (/* setting */) => {
			// TODO: Invoke saveProactiveUserEngagementSettings action with provided setting.
			// const { error } = await dispatch( CORE_USER ).saveProactiveUserEngagementSettings( setting );
			// if ( ! error ) setNotice( { type: 'success', text} );
			// else setNotice( { type: 'error', text: error?.message || __( 'An error occurred.', 'google-site-kit' ) } );
			setNotice( {
				type: 'success',
				text: __(
					'You’ve successfully subscribed to email reports!',
					'google-site-kit'
				),
			} );
		},
		[]
	);

	const onUnsubscribe = useCallback( async () => {
		// TODO: Call saveProactiveUserEngagementSettings( { subscribed: false } ) and set info/error notices accordingly.
		setNotice( {
			type: 'info',
			text: __(
				'You’ve unsubscribed from email reports',
				'google-site-kit'
			),
		} );
	}, [] );

	const onNoticeDismiss = useCallback( () => setNotice( null ), [] );

	return (
		<SelectionPanel
			className="googlesitekit-user-settings-selection-panel"
			isOpen={ !! isOpen }
			onOpen={ onOpen }
			closePanel={ closePanel }
		>
			<PanelContent
				savedFrequency={
					undefined /* TODO: pass value from settings */
				}
				notice={ notice }
				onSaveCallback={ onSaveCallback }
				onUnsubscribe={ onUnsubscribe }
				onNoticeDismiss={ onNoticeDismiss }
				closePanel={ closePanel }
			/>
		</SelectionPanel>
	);
}
