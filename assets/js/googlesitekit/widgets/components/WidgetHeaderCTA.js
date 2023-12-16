/**
 * WidgetHeaderCTA component.
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
import Link from '../../../components/Link';

function WidgetHeaderCTA( { href, label, external } ) {
	return (
		<div className="googlesitekit-widget__header--cta">
			<Link href={ href } external={ external }>
				{ label }
			</Link>
		</div>
	);
}

WidgetHeaderCTA.propTypes = {
	href: PropTypes.string,
	label: PropTypes.string.isRequired,
	external: PropTypes.bool,
};

WidgetHeaderCTA.defaultProps = {
	href: '',
	external: true,
};

export default WidgetHeaderCTA;
