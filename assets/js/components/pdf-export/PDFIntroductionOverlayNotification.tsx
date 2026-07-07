/**
 * PDFIntroductionOverlayNotification component.
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import OverlayNotification from '@/js/googlesitekit/notifications/components/layout/OverlayNotification';
import PDFExportOverlayGraphic from '@/svg/graphics/pdf-export-overlay.svg';

interface PDFIntroductionOverlayNotificationProps {
	id: string;
	Notification: ElementType;
}

const PDFIntroductionOverlayNotification: FC<
	PDFIntroductionOverlayNotificationProps
> = ( { id, Notification } ) => {
	const { setValue } = useDispatch( CORE_UI );

	const onTryIt = useCallback( () => {
		setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
	}, [ setValue ] );

	return (
		<Notification>
			<OverlayNotification
				notificationID={ id }
				className="googlesitekit-pdf-introduction-overlay"
				anchorID=".googlesitekit-pdf-download__button"
				title={ __( 'Export to PDF', 'google-site-kit' ) }
				description={ __(
					'You can now create a custom report featuring current metrics from your dashboard',
					'google-site-kit'
				) }
				GraphicDesktop={ PDFExportOverlayGraphic }
				GraphicMobile={ PDFExportOverlayGraphic }
				ctaButton={ {
					label: __( 'Try it', 'google-site-kit' ),
					onClick: onTryIt,
					dismissOnClick: true,
				} }
				dismissButton={ {
					label: __( 'Got it', 'google-site-kit' ),
				} }
				newBadge
			/>
		</Notification>
	);
};

export default PDFIntroductionOverlayNotification;
