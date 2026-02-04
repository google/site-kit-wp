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
import OptIn from '@/js/components/OptIn';
import useViewContext from '@/js/hooks/useViewContext';
import Link from '@/js/components/Link';

export default function Tracking() {
	const viewContext = useViewContext();

	return (
		<OptIn
			title={ __( 'Help us improve Site Kit', 'google-site-kit' ) }
			description={ createInterpolateElement(
				__(
					'Share anonymous usage data. All collected data is treated in accordance with the <a>Google Privacy Policy</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href="https://policies.google.com/privacy"
							external
						/>
					),
				}
			) }
			trackEventCategory={ `${ viewContext }_headerbar_viewonly` }
			layout="stacked"
		/>
	);
}
