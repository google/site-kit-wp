/**
 * Sign in with Google Preview component.
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
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';

export default function Preview() {
	const [ scriptLoaded, setScriptLoaded ] = useState( false );
	const containerRef = useRef();

	const shape = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getShape()
	);
	const text = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getText()
	);
	const theme = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getTheme()
	);

	useEffect( () => {
		const script = document.createElement( 'script' );
		const onLoad = () => {
			setScriptLoaded( true );

			// Using a fake client ID here since the user won't be able
			// to click on the button anyway.
			global.google.accounts.id.initialize( { client_id: 'notrealclientid' } );
		};

		script.src = 'https://accounts.google.com/gsi/client';
		script.addEventListener( 'load', onLoad );

		document.body.appendChild( script );

		return () => {
			setScriptLoaded( false );
			script.removeEventListener( 'load', onLoad );
			document.body.removeChild( script );
		};
	}, [ setScriptLoaded ] );

	useEffect( () => {
		if ( scriptLoaded ) {
			global.google.accounts.id.renderButton( containerRef.current, {
				text,
				theme,
				shape,
			} );
		}
	}, [ scriptLoaded, containerRef, text, theme, shape ] );

	return (
		<div className="googlesitekit-sign-in-with-google__preview">
			<p className="googlesitekit-sign-in-with-google__preview--label">
				{ __( 'Preview', 'google-site-kit' ) }
			</p>
			<div ref={ containerRef } />
			<div className="googlesitekit-sign-in-with-google__preview--protector" />
		</div>
	);
}
