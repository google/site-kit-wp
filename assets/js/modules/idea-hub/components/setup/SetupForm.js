/**
 * Idea Hub Setup Form component.
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_IDEA_HUB } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import Checkbox from '../../../../components/Checkbox';
import Button from '../../../../components/Button';
import SettingsNotice from '../../../../components/SettingsNotice';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const { description } = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'idea-hub' )
	);
	const tosAccepted = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getTosAccepted()
	);
	const { setTosAccepted } = useDispatch( MODULES_IDEA_HUB );

	const onChange = useCallback(
		( event ) => {
			const { checked } = event.target;
			setTosAccepted( checked );
		},
		[ setTosAccepted ]
	);

	const { submitChanges } = useDispatch( MODULES_IDEA_HUB );
	const submitForm = useCallback(
		async ( event ) => {
			event.preventDefault();
			const { error } = await submitChanges();
			if ( ! error ) {
				finishSetup();
			}
		},
		[ finishSetup, submitChanges ]
	);

	return (
		<form
			className="googlesitekit-ideahub-setup__form"
			onSubmit={ submitForm }
		>
			<p>{ description }</p>

			<SettingsNotice
				notice={ __(
					'Idea Hub is only available in the US for now',
					'google-site-kit'
				) }
			/>

			<div className="googlesitekit-ideahub-setup__checkbox">
				<Checkbox
					name="tosAccepted"
					id="tosAccepted"
					value="1"
					checked={ tosAccepted }
					onChange={ onChange }
				>
					{ __(
						'I agree that Idea Hub will track my usage of the feature (e.g. creating a draft; saving/dismissing ideas) in order to provide better idea suggestions',
						'google-site-kit'
					) }
				</Checkbox>
			</div>

			<Button
				className="googlesitekit-ideahub-setup__button"
				disabled={ ! tosAccepted }
			>
				{ __( 'Continue', 'google-site-kit' ) }
			</Button>
		</form>
	);
}
