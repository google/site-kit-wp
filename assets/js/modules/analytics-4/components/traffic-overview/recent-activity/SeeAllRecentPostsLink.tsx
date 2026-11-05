/**
 * Recent activity "See all recent posts" link.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { ANCHOR_ID_CONTENT } from '@/js/googlesitekit/constants';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import {
	LATEST_CONTENT_RECENT_CONTENT_OPTIONS,
	LATEST_CONTENT_TAB_ID,
} from '@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4/constants';
import { useChangeContentTab } from '@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4/hooks/useChangeContentTab';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { getNavigationalScrollTop } from '@/js/util/scroll';
import ArrowDownIcon from '@/svg/icons/arrow-down.svg';

const SeeAllRecentPostsLink: FC = () => {
	const breakpoint = useBreakpoint();

	const canViewSharedAnalytics4 = useCanViewSharedModule(
		MODULE_SLUG_ANALYTICS_4
	);

	const contentIDForLink = `#${ ANCHOR_ID_CONTENT }`;

	const recentContent = useInViewSelect< RecentContentItem[] | undefined >(
		( select: Select ) =>
			canViewSharedAnalytics4
				? select( MODULES_ANALYTICS_4 ).getRecentContent(
						LATEST_CONTENT_RECENT_CONTENT_OPTIONS
				  )
				: undefined,
		[ canViewSharedAnalytics4 ]
	);

	const changeContentTab = useChangeContentTab();

	if ( recentContent === undefined || recentContent.length < 2 ) {
		return null;
	}

	/* eslint-disable sitekit/function-declaration-consistency */
	// To type this function, the handler must be declared as a constant, not a
	// function.
	const handleClick: React.MouseEventHandler<
		HTMLAnchorElement | HTMLButtonElement
	> = ( event ) => {
		changeContentTab( LATEST_CONTENT_TAB_ID );

		global.history.replaceState( {}, '', contentIDForLink );
		global.scrollTo( {
			top: getNavigationalScrollTop( contentIDForLink, breakpoint ),
			behavior: 'smooth',
		} );

		event.preventDefault();
	};
	/* eslint-enable sitekit/function-declaration-consistency */

	return (
		<Link
			className="googlesitekit-traffic-overview__see-all-recent-posts"
			href={ contentIDForLink }
			onClick={ handleClick }
			trailingIcon={ <ArrowDownIcon width={ 9 } height={ 12 } /> }
			secondary
		>
			{ __( 'See all recent posts', 'google-site-kit' ) }
		</Link>
	);
};

export default SeeAllRecentPostsLink;
