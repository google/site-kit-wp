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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, type Select } from 'googlesitekit-data';
import { Button as UntypedButton } from 'googlesitekit-components';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-generation/constants';
// @ts-expect-error - We need to add types for imported SVGs.
import DownloadIcon from '@/svg/icons/download.svg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The `Button` component is not yet typed.
const Button = UntypedButton as React.FC< any >;

export default function PDFDownloadButton() {
	const isOpen = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY ),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );

	const togglePanel = useCallback( () => {
		setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, ! isOpen );
	}, [ isOpen, setValue ] );

	return (
		<Button
			aria-label={ __( 'Download PDF report', 'google-site-kit' ) }
			className="googlesitekit-pdf-download__button googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon"
			onClick={ togglePanel }
			icon={ <DownloadIcon width={ 20 } height={ 20 } /> }
			tooltipEnterDelayInMS={ 500 }
			tertiary
		/>
	);
}
