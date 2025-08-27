/**
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
import PropTypes from 'prop-types';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RefocusableModalDialog from '@/js/components/RefocusableModalDialog';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';

export default function ConfirmDisableConversionTrackingDialog( {
	onConfirm,
	onCancel,
} ) {
	const viewContext = useViewContext();

	const subtitle = __(
		'By disabling plugin conversion tracking, you will no longer have access to:',
		'google-site-kit'
	);

	const provides = [
		__( 'Performance of your Ad campaigns', 'google-site-kit' ),
		__(
			'Tracking additional conversion-related events via Analytics',
			'google-site-kit'
		),
	];

	useMount( () => {
		trackEvent( `${ viewContext }`, 'ect_view_modal' );
	} );

	return (
		<RefocusableModalDialog
			className="googlesitekit-settings-module__confirm-disconnect-modal"
			title={ __(
				'Disable plugin conversion tracking',
				'google-site-kit'
			) }
			subtitle={ subtitle }
			handleConfirm={ onConfirm }
			handleCancel={ onCancel }
			onClose={ onCancel }
			provides={ provides }
			confirmButton={ __( 'Disable', 'google-site-kit' ) }
			dialogActive
			danger
		/>
	);
}

ConfirmDisableConversionTrackingDialog.propTypes = {
	onConfirm: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};
