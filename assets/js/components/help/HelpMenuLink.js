/**
 * HelpMenuLink component.
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

/**
 * Internal dependencies
 */
import Link from '../Link';

function HelpMenuLink( { children, href } ) {
	return (
		<li className="googlesitekit-help-menu-link mdc-list-item" role="menuitem">
			<Link
				className="mdc-list-item__text"
				href={ href }
				external
				hideExternalIndicator
				inherit
			>
				{ children }
			</Link>
		</li>
	);
}

HelpMenuLink.propTypes = {
	children: PropTypes.node.isRequired,
	href: PropTypes.string.isRequired,
};

export default HelpMenuLink;
