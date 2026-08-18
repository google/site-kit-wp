/**
 * Audience Creation Success Notice component.
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
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import {
	AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG,
	AUDIENCE_SELECTION_PANEL_OPENED_KEY,
} from './constants';

export default function AudienceCreationSuccessNotice() {
	const viewContext = useViewContext();

	const { setValue } = useDispatch( CORE_UI );

	const showSuccessNotice = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG )
	);
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
	);

	// Track an event when the notice is viewed.
	useEffect( () => {
		if ( isOpen && showSuccessNotice ) {
			trackEvent(
				`${ viewContext }_audiences-sidebar-create-audiences-success`,
				'view_notification'
			);
		}
	}, [ isOpen, showSuccessNotice, viewContext ] );

	if ( ! showSuccessNotice ) {
		return null;
	}

	return (
		<SelectionPanelNotice
			description={ __(
				'Visitor group created successfully!',
				'google-site-kit'
			) }
			dismissButton={ {
				onClick: () => {
					trackEvent(
						`${ viewContext }_audiences-sidebar-create-audiences-success`,
						'dismiss_notification'
					).finally( () => {
						setValue(
							AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG,
							false
						);
					} );
				},
			} }
			type={ NOTICE_TYPES.SUCCESS }
		/>
	);
}
