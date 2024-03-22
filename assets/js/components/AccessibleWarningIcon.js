/**
 * AccessibleWarningIcon component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VisuallyHidden from './VisuallyHidden';
import WarningIcon from '../../svg/icons/warning-v2.svg';

export default function AccessibleWarningIcon( {
	height = 12,
	screenReaderText = __( 'Error', 'google-site-kit' ),
	width = 14,
} ) {
	return (
		<Fragment>
			<VisuallyHidden>{ screenReaderText }</VisuallyHidden>
			<WarningIcon width={ width } height={ height } />
		</Fragment>
	);
}

AccessibleWarningIcon.propTypes = {
	height: PropTypes.number,
	screenReaderText: PropTypes.string,
	width: PropTypes.number,
};
