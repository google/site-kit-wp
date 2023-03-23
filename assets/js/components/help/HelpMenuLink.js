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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '../Link';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

function HelpMenuLink( { children, href, gaEventLabel } ) {
	const viewContext = useViewContext();

	const onClick = useCallback( async () => {
		if ( gaEventLabel ) {
			await trackEvent(
				`${ viewContext }_headerbar_helpmenu`,
				'click_outgoing_link',
				gaEventLabel
			);
		}
	}, [ gaEventLabel, viewContext ] );

	return (
		<li className="googlesitekit-help-menu-link mdc-list-item" role="none">
			<Link
				className="mdc-list-item__text"
				href={ href }
				external
				hideExternalIndicator
				role="menuitem"
				onClick={ onClick }
			>
				{ children }
			</Link>
		</li>
	);
}

HelpMenuLink.propTypes = {
	children: PropTypes.node.isRequired,
	href: PropTypes.string.isRequired,
	gaEventLabel: PropTypes.string,
};

export default HelpMenuLink;
