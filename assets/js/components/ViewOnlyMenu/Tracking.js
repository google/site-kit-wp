/**
 * ViewOnlyMenu > Tracking component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import OptIn from '../OptIn';
import useViewContext from '../../hooks/useViewContext';

export default function Tracking() {
	const viewContext = useViewContext();

	return (
		<li className="googlesitekit-view-only-menu__list-item">
			<p>
				{ createInterpolateElement(
					__(
						'Thanks for using Site Kit!<br />Help us make it even better',
						'google-site-kit'
					),
					{
						br: <br />,
					}
				) }
			</p>
			<OptIn
				trackEventCategory={ `${ viewContext }_headerbar_viewonly` }
				alignCheckboxLeft
			/>
		</li>
	);
}
