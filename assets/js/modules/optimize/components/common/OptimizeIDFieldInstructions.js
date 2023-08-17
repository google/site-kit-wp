/**
 * OptimizeIDFieldInstructions component.
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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_OPTIMIZE } from '../../../optimize/datastore/constants';
import Link from '../../../../components/Link';

const { useSelect } = Data;

export default function OptimizeIDFieldInstructions() {
	const accountURL = useSelect( ( select ) =>
		select( MODULES_OPTIMIZE ).getServiceURL( { path: '/accounts' } )
	);

	return (
		<p>
			{ createInterpolateElement(
				__(
					'Please copy and paste your Optimize Container ID to complete your setup. <a>You can locate this here</a>',
					'google-site-kit'
				),
				{
					a: <Link href={ accountURL } external />,
				}
			) }
		</p>
	);
}
