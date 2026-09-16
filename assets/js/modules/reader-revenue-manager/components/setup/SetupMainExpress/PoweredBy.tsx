/**
 * Reader Revenue Manager express setup powered by component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import PoweredByModule from '@/js/components/PoweredByModule';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';

export default function PoweredBy() {
	return (
		<PoweredByModule
			slug={ MODULE_SLUG_READER_REVENUE_MANAGER }
			text={ createInterpolateElement(
				__(
					'Powered by <br /> Reader Revenue Manager',
					'google-site-kit'
				),
				{
					br: <br />,
				}
			) }
		/>
	);
}
