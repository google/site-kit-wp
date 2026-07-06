/**
 * Key Metrics KeyMetricsBackNotice component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	KEY_METRICS_BACK_NOTICE_SLUG,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
} from './constants';

interface KeyMetricsBackNoticeProps {
	Widget: ElementType;
}

export default function KeyMetricsBackNotice( {
	Widget,
}: KeyMetricsBackNoticeProps ) {
	const { dismissItem } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );

	const onSelectMetrics = useCallback( () => {
		dismissItem( KEY_METRICS_BACK_NOTICE_SLUG );
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ dismissItem, setValue ] );

	const onDismiss = useCallback( () => {
		dismissItem( KEY_METRICS_BACK_NOTICE_SLUG );
	}, [ dismissItem ] );

	return (
		<Widget noPadding>
			<Notice
				className="googlesitekit-key-metrics-back-notice"
				type={ NOTICE_TYPES.INFO_CIRCLE }
				title={ __(
					'Key metrics are back on your dashboard',
					'google-site-kit'
				) }
				description={ __(
					'This section is now an integral part of the dashboard. You can customize which metrics are shown to focus on the ones most relevant to you.',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Select metrics', 'google-site-kit' ),
					onClick: onSelectMetrics,
				} }
				dismissButton={ {
					label: __( 'Got it', 'google-site-kit' ),
					onClick: onDismiss,
				} }
			/>
		</Widget>
	);
}
