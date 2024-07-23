/**
 * Audience Creation Success Notice component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { Button } from 'googlesitekit-components';
import CheckFill from '../../../../../../../svg/icons/check-fill.svg';
import { AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG } from './constants';

export default function AudienceCreationSuccessNotice() {
	const { setValue } = useDispatch( CORE_UI );
	const showSuccessNotice = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG )
	);

	if ( ! showSuccessNotice ) {
		return null;
	}

	return (
		<div className="googlesitekit-narrow-subtle-notification">
			<div className="googlesitekit-subtle-notification__icon">
				<CheckFill width={ 24 } height={ 24 } />
			</div>
			<div className="googlesitekit-subtle-notification__content googlesitekit-subtle-notification__content--no-margin">
				<p className="googlesitekit-subtle-notification__secondary_description googlesitekit-subtle-notification__secondary_description--small">
					{ __(
						'Visitor group created successfully!',
						'google-site-kit'
					) }
				</p>
			</div>
			<div className="googlesitekit-subtle-notification__action">
				<Button
					tertiary
					onClick={ () => {
						setValue(
							AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG,
							false
						);
					} }
				>
					{ __( 'Got it', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}
