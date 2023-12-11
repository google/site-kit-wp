/**
 * SetupAccountNoClient component.
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
import {
	Fragment,
	createInterpolateElement,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import SupportLink from '../../../../components/SupportLink';
import { ErrorNotices } from '../common';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';

export default function SetupAccountNoClient() {
	const viewContext = useViewContext();

	const onButtonClick = useCallback( () => {
		trackEvent( `${ viewContext }_adsense`, 'apply_afc' );
	}, [ viewContext ] );

	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __(
					'Looks like you need to upgrade your AdSense account',
					'google-site-kit'
				) }
			</h3>

			<ErrorNotices />

			<p>
				{ createInterpolateElement(
					__(
						'To start using AdSense on your website, you need to upgrade your account to add “AdSense for content”. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<SupportLink
								path="/adsense/answer/6023158"
								external
								aria-label={ __(
									'Learn more about updating your AdSense account',
									'google-site-kit'
								) }
							/>
						),
					}
				) }
			</p>

			<div className="googlesitekit-setup-module__action">
				<Button
					href="https://www.google.com/adsense"
					target="_blank"
					aria-label={ __(
						'Learn more about updating your AdSense account',
						'google-site-kit'
					) }
					onClick={ onButtonClick }
				>
					{ __( 'Apply now', 'google-site-kit' ) }
				</Button>
			</div>
		</Fragment>
	);
}
