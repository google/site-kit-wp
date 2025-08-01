/**
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
import Link from '../Link';

export default function LearnMoreLink( {
	href,
	className,
	label = __( 'Learn more', 'google-site-kit' ),
	external = true,
	onClick = () => {},
} ) {
	if ( ! href ) {
		return null;
	}

	return (
		<Link
			href={ href }
			className={ className }
			onClick={ onClick }
			external={ external }
		>
			{ label }
		</Link>
	);
}

LearnMoreLink.propTypes = {
	href: PropTypes.string.isRequired,
	className: PropTypes.string,
	label: PropTypes.string,
	external: PropTypes.bool,
	onClick: PropTypes.func,
};
