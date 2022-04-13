/**
 * ViewOnlyMenu > Description component.
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
import Data from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
} from '../../googlesitekit/datastore/user/constants';
import Button from '../../components/Button';
import Link from '../../components/Link';
const { useSelect } = Data;

export default function Description() {
	const canAuthenticate = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_AUTHENTICATE )
	);

	const description = canAuthenticate
		? __(
				"View-only access lets you see stats from all shared Google services, but you can't make any changes.",
				'google-site-kit'
		  )
		: createInterpolateElement(
				__(
					"View-only access lets you see stats from all shared Google services, but you can't make any changes. <a>Learn more</a>",
					'google-site-kit'
				),
				{
					a: (
						<Link
							href="https://sitekit.withgoogle.com/documentation/using-site-kit/dashboard-sharing/"
							inherit
							external
							aria-label={ __(
								'Learn more about dashboard sharing',
								'google-site-kit'
							) }
						/>
					),
				}
		  );

	return (
		<li className="googlesitekit-view-only-menu__list-item">
			<p className="">{ description }</p>
			{ canAuthenticate && (
				<Button onClick={ () => {} }>
					{ __( 'Sign in with Google', 'google-site-kit' ) }
				</Button>
			) }
		</li>
	);
}
