/**
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
import {
	createInterpolateElement,
	Fragment,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch, HelperText } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import Link from '../../../../components/Link';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

export default function OneTapToggles() {
	const viewContext = useViewContext();
	const oneTapEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapEnabled()
	);
	const oneTapOnAllPages = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapOnAllPages()
	);
	const { setOneTapEnabled, setOneTapOnAllPages } = useDispatch(
		MODULES_SIGN_IN_WITH_GOOGLE
	);

	const trackOneTapToggleChange = useCallback( () => {
		trackEvent(
			`${ viewContext }_sign-in-with-google-settings`,
			! oneTapEnabled ? 'enable_one_tap' : 'disable_one_tap'
		);
	}, [ viewContext, oneTapEnabled ] );

	const trackOneTapOnAllPagesToggleChange = useCallback( () => {
		trackEvent(
			`${ viewContext }_sign-in-with-google-settings`,
			! oneTapOnAllPages
				? 'enable_one_tap_on_all_pages'
				: 'disable_one_tap_on_all_pages'
		);
	}, [ viewContext, oneTapOnAllPages ] );

	const onOneTapChange = useCallback( () => {
		setOneTapEnabled( ! oneTapEnabled );
		trackOneTapToggleChange();
	}, [ oneTapEnabled, setOneTapEnabled, trackOneTapToggleChange ] );

	const onOneTapOnAllPagesChange = useCallback( () => {
		setOneTapOnAllPages( ! oneTapOnAllPages );
		trackOneTapOnAllPagesToggleChange();
	}, [
		oneTapOnAllPages,
		setOneTapOnAllPages,
		trackOneTapOnAllPagesToggleChange,
	] );

	const learnMoreLink = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'sign-in-with-google-one-tap'
		);
	} );

	return (
		<Fragment>
			<div className="googlesitekit-settings-module__fields-group googlesitekit-settings-module__one-tap">
				<Switch
					label={ __( 'Enable One Tap sign in', 'google-site-kit' ) }
					checked={ oneTapEnabled }
					onClick={ onOneTapChange }
					hideLabel={ false }
				/>
				<HelperText persistent>
					{ createInterpolateElement(
						__(
							'One Tap allows users to sign in or sign up with one click offering smooth user entry points without redirecting to a dedicated sign in and sign up page. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									key="link"
									href={ learnMoreLink }
									external
								/>
							),
						}
					) }
				</HelperText>
			</div>
			<div className="googlesitekit-settings-module__fields-group googlesitekit-settings-module__one-tap-on-all-pages">
				<Switch
					label={ __(
						'One Tap enabled on all pages',
						'google-site-kit'
					) }
					checked={ !! oneTapOnAllPages }
					onClick={ onOneTapOnAllPagesChange }
					disabled={ ! oneTapEnabled }
					hideLabel={ false }
				/>
				<HelperText persistent>
					{ !! oneTapOnAllPages
						? __(
								'One Tap will be available on every page on this website.',
								'google-site-kit'
						  )
						: __(
								'One Tap will only appear on existing login pages.',
								'google-site-kit'
						  ) }
				</HelperText>
			</div>
		</Fragment>
	);
}
