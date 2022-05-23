/**
 * SourceLink component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from './Link';
import useViewOnly from '../hooks/useViewOnly';

function SourceLink( { name, href, className, external } ) {
	const viewOnlyDashboard = useViewOnly();

	if ( viewOnlyDashboard ) {
		return null;
	}

	return (
		<div className={ classnames( 'googlesitekit-source-link', className ) }>
			{ createInterpolateElement(
				sprintf(
					/* translators: %s: source link */
					__( 'Source: %s', 'google-site-kit' ),
					`<a>${ name }</a>`
				),
				{
					a: <Link key="link" href={ href } external={ external } />,
				}
			) }
		</div>
	);
}

SourceLink.propTypes = {
	name: PropTypes.string,
	href: PropTypes.string,
	className: PropTypes.string,
	external: PropTypes.bool,
};

SourceLink.defaultProps = {
	name: '',
	href: '',
	className: '',
	external: false,
};

export default SourceLink;
