/**
 * ConversionReportingDashboardSubtleNotification component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notice from '../../components/Notice';

export default function ConversionReportingDashboardSubtleNotification( {
	description,
	ctaLabel,
	handleCTAClick,
	isSaving = false,
	onDismiss,
	dismissCTALabel = __( 'Maybe later', 'google-site-kit' ),
} ) {
	return (
		<Notice
			type="new"
			title={ __( 'New key metrics were added!', 'google-site-kit' ) }
			description={ description }
			dismissButton={ {
				label: dismissCTALabel,
				onClick: onDismiss,
			} }
			ctaButton={ {
				label: ctaLabel,
				onClick: handleCTAClick,
				inProgress: isSaving,
				disabled: isSaving,
			} }
		/>
	);
}

ConversionReportingDashboardSubtleNotification.propTypes = {
	description: PropTypes.node.isRequired,
	ctaLabel: PropTypes.string.isRequired,
	handleCTAClick: PropTypes.func.isRequired,
	isSaving: PropTypes.bool,
	onDismiss: PropTypes.func.isRequired,
	dismissCTALabel: PropTypes.string,
};
