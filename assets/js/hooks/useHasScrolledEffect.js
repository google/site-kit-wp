/**
 * Has Scrolled hook.
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
 * External dependencies
 */
import { useWindowScroll } from 'react-use';
import { useEffect, useState } from '@wordpress/element';

/**
 * Returns whether the user has scrolled the page and adds/remove the googlesitekit-plugin--has-scrolled class to the body.
 *
 * @since 1.50.0
 *
 * @return {boolean} `true` if the user has scrolled the page, `false` otherwise.
 */
export const useHasScrolledEffect = () => {
	const { y } = useWindowScroll();
	const [ hasScrolled, setHasScrolled ] = useState( false );
	const className = 'googlesitekit-plugin--has-scrolled';

	useEffect( () => {
		if ( hasScrolled ) {
			global.document.body.classList.add( className );
		} else {
			global.document.body.classList.remove( className );
		}
	}, [ hasScrolled ] );

	if ( y > 0 && ! hasScrolled ) {
		setHasScrolled( true );
	} else if ( y === 0 && hasScrolled ) {
		setHasScrolled( false );
	}

	return hasScrolled;
};
