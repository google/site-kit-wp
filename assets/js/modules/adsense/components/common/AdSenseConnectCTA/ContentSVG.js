/**
 * IdeaHubPromptSVG component.
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
import { PropTypes } from 'prop-types';

/**
 * WordPress dependencies
 */
import { lazy, Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PreviewBlock from '../../../../../components/PreviewBlock';
const LazyContentSVG0 = lazy( () =>
	import( '../../../../../../svg/graphics/adsense-connect-0.svg' )
);
const LazyContentSVG1 = lazy( () =>
	import( '../../../../../../svg/graphics/adsense-connect-1.svg' )
);
const LazyContentSVG2 = lazy( () =>
	import( '../../../../../../svg/graphics/adsense-connect-2.svg' )
);

function LazyContentSVG( { stage } ) {
	switch ( stage ) {
		case 0:
			return <LazyContentSVG0 />;
		case 1:
			return <LazyContentSVG1 />;
		case 2:
			return <LazyContentSVG2 />;
	}
}

export default function ContentSVG( { stage } ) {
	return (
		<Suspense fallback={ <PreviewBlock width="100%" height="39.77%" /> }>
			<LazyContentSVG stage={ stage } />
		</Suspense>
	);
}

ContentSVG.propTypes = {
	stage: PropTypes.oneOf( [ 0, 1, 2 ] ).isRequired,
};
