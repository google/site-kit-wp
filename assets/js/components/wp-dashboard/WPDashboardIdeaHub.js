/**
 * Idea Hub notice component.
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
 * External dependencies
 */
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	MODULES_IDEA_HUB,
	IDEA_HUB_GA_CATEGORY_WPDASHBOARD,
} from '../../modules/idea-hub/datastore/constants';
import { trackEvent } from '../../util';
import GoogleLogoIcon from '../../../svg/graphics/logo-g.svg';
import Link from '../Link';
import whenActive from '../../util/when-active';
const { useSelect, useInViewSelect } = Data;

function WPDashboardIdeaHub() {
	const trackingRef = useRef();
	const [ hasBeenInView, setHasBeenInView ] = useState( false );

	const savedIdeas = useInViewSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getSavedIdeas()
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
			'idea-hub-tab': 'saved-ideas',
		} )
	);

	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const inView = !! intersectionEntry?.intersectionRatio;

	useEffect( () => {
		if ( inView && ! hasBeenInView ) {
			trackEvent( IDEA_HUB_GA_CATEGORY_WPDASHBOARD, 'view_notification' );
			setHasBeenInView( true );
		}
	}, [ hasBeenInView, inView ] );

	const onClick = useCallback( async () => {
		await trackEvent(
			IDEA_HUB_GA_CATEGORY_WPDASHBOARD,
			'confirm_notification'
		);
	}, [] );

	// If the saved ideas from Idea Hub haven't finished loading yet,
	// show an empty div. This allows `useIntersection` to work as expected.
	if ( savedIdeas === undefined ) {
		return <div ref={ trackingRef } />;
	}

	// If the saved ideas from Idea Hub are empty, don't show the notice.
	if ( ! savedIdeas?.length ) {
		return null;
	}

	return (
		<div
			className="googlesitekit-idea-hub__wpdashboard--notice"
			ref={ trackingRef }
		>
			<div className="googlesitekit-idea-hub__wpdashboard--header">
				<GoogleLogoIcon width="16" height="16" />
			</div>

			<div className="googlesitekit-idea-hub__wpdashboard--copy">
				{ __(
					'Want some inspiration for a new post?',
					'google-site-kit'
				) }
			</div>

			<div className="googlesitekit-idea-hub__wpdashboard--link">
				<Link href={ dashboardURL } onClick={ onClick }>
					{ __( 'View Ideas', 'google-site-kit' ) }
				</Link>
			</div>
		</div>
	);
}

export default whenActive( {
	moduleName: 'idea-hub',
} )( WPDashboardIdeaHub );
