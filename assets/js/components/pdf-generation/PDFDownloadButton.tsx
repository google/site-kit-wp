/**
 * PDFDownloadButton component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, type Select } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import DownloadIcon from '@/svg/icons/download.svg';

const PDFDownloadButton: FC = () => {
	const isOpen = useSelect(
		( select: Select ) => select( CORE_PDF ).isSectionsPanelOpen(),
		[]
	);

	const { openSectionsPanel, closeSectionsPanel } = useDispatch( CORE_PDF );

	const togglePanel = useCallback( () => {
		if ( isOpen ) {
			closeSectionsPanel();
		} else {
			openSectionsPanel();
		}
	}, [ isOpen, openSectionsPanel, closeSectionsPanel ] );

	return (
		<Button
			aria-label={ __( 'Download PDF report', 'google-site-kit' ) }
			// @ts-expect-error - The `Button` component is not typed yet.
			className="googlesitekit-pdf-download__button googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon"
			onClick={ togglePanel }
			icon={ <DownloadIcon width={ 20 } height={ 20 } /> }
			tooltipEnterDelayInMS={ 500 }
			tertiary
		/>
	);
};

export default PDFDownloadButton;
