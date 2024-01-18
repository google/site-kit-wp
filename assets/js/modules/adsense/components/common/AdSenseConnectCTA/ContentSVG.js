/**
 * AdSenseConnectCTA > ContentSVG component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PreviewBlock from '../../../../../components/PreviewBlock';
import MediaErrorHandler from '../../../../../components/MediaErrorHandler';
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
	const graphics = {
		0: <LazyContentSVG0 />,
		1: <LazyContentSVG1 />,
		2: <LazyContentSVG2 />,
	};

	if ( ! graphics[ stage ] ) {
		return null;
	}

	return (
		<MediaErrorHandler
			errorMessage={ __( 'Failed to load graphic', 'google-site-kit' ) }
		>
			{ graphics[ stage ] }
		</MediaErrorHandler>
	);
}

export default function ContentSVG( { stage } ) {
	return (
		<Suspense fallback={ <PreviewBlock width="100%" height="100%" /> }>
			<LazyContentSVG stage={ stage } />
		</Suspense>
	);
}

ContentSVG.propTypes = {
	stage: PropTypes.oneOf( [ 0, 1, 2 ] ).isRequired,
};
