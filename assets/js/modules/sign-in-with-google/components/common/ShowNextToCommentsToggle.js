/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch, HelperText } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import Link from '@/js/components/Link';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

export default function ShowNextToCommentsToggle() {
	const viewContext = useViewContext();
	const showNextToCommentsEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getShowNextToCommentsEnabled()
	);
	const { setShowNextToCommentsEnabled } = useDispatch(
		MODULES_SIGN_IN_WITH_GOOGLE
	);

	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);

	const isMultisite = useSelect( ( select ) =>
		select( CORE_SITE ).isMultisite()
	);

	const trackShowNextToCommentsToggleChange = useCallback( () => {
		trackEvent(
			`${ viewContext }_sign-in-with-google-settings`,
			! showNextToCommentsEnabled ? 'enable_comments' : 'disable_comments'
		);
	}, [ viewContext, showNextToCommentsEnabled ] );

	const onShowNextToCommentsChange = useCallback( () => {
		setShowNextToCommentsEnabled( ! showNextToCommentsEnabled );
		trackShowNextToCommentsToggleChange();
	}, [
		showNextToCommentsEnabled,
		setShowNextToCommentsEnabled,
		trackShowNextToCommentsToggleChange,
	] );

	const learnMoreLink = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'sign-in-with-google-comments'
		);
	} );

	return (
		<div className="googlesitekit-settings-module__fields-group googlesitekit-settings-module__show-next-to-comments">
			<Switch
				label={ __( 'Show next to comments', 'google-site-kit' ) }
				checked={ showNextToCommentsEnabled }
				onClick={ onShowNextToCommentsChange }
				hideLabel={ false }
				disabled={ ! anyoneCanRegister }
			/>
			<HelperText persistent>
				{ createInterpolateElement(
					__(
						'Show a Sign in with Google button next to comments and allow users to use their Google Account to leave comments. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: <Link key="link" href={ learnMoreLink } external />,
					}
				) }
			</HelperText>
			{ ! anyoneCanRegister && (
				<HelperText persistent>
					{ isMultisite
						? __(
								'Requires open user registration. Please enable "Allow new registrations" in your WordPress Settings.',
								'google-site-kit'
						  )
						: __(
								'Requires open user registration. Please enable "Anyone can register" in your WordPress Settings.',
								'google-site-kit'
						  ) }
				</HelperText>
			) }
		</div>
	);
}
