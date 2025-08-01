/**
 * Audience Segmentation CreateCustomDimensionCTA component.
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
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';

const CreateCustomDimensionCTA = forwardRef( ( { onClick, isSaving }, ref ) => {
	return (
		<div
			ref={ ref }
			className="googlesitekit-audience-segmentation-tile-metric__no-data"
		>
			{ __( 'No data to show', 'google-site-kit' ) }
			<p>
				{ __( 'Update Analytics to track metric', 'google-site-kit' ) }
			</p>
			<SpinnerButton
				onClick={ onClick }
				isSaving={ isSaving }
				disabled={ isSaving }
				danger
			>
				{ __( 'Update', 'google-site-kit' ) }
			</SpinnerButton>
		</div>
	);
} );

CreateCustomDimensionCTA.propTypes = {
	onClick: PropTypes.func.isRequired,
	isSaving: PropTypes.bool,
};

export default CreateCustomDimensionCTA;
