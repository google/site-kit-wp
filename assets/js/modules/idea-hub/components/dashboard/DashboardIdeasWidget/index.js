/**
 * DashboardIdeasWidget component
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
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import { useHash, useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import whenActive from '../../../../../util/when-active';
import NewIdeas from './NewIdeas';
import SavedIdeas from './SavedIdeas';
import DraftIdeas from './DraftIdeas';

const getHash = ( hash ) => hash ? hash.replace( '#', '' ) : false;
const isValidHash = ( hash ) => getHash( hash ) in DashboardIdeasWidget.tabToIndex;

const DashboardIdeasWidget = () => {
	const ideaHubContainer = useRef();
	const [ hash, setHash ] = useHash();
	const [ activeTabIndex, setActiveTabIndex ] = useState( DashboardIdeasWidget.tabToIndex[ getHash( hash ) ] );
	const activeTab = DashboardIdeasWidget.tabIDsByIndex[ activeTabIndex ];

	const getIdeaHubContainerOffset = () => {
		const tabletBreakpoint = global.window.matchMedia( '(min-width: 600px)' );
		const desktopBreakpoint = global.window.matchMedia( '(min-width: 960px)' );
		let adminBarHeight = 0;
		let siteHeaderHeight = 68;
		let marginBottom = 16;

		if ( tabletBreakpoint.matches ) {
			adminBarHeight = 46;
		}

		if ( desktopBreakpoint.matches ) {
			siteHeaderHeight = 84;
			marginBottom = 24;
			adminBarHeight = 32;
		}
		const headerOffset = ( siteHeaderHeight + adminBarHeight + marginBottom ) * -1;
		return ideaHubContainer.current.getBoundingClientRect().top + global.window.pageYOffset + headerOffset;
	};

	useMount( () => {
		if ( ! ideaHubContainer?.current || ! isValidHash( hash ) ) {
			return;
		}

		setTimeout( () => {
			global.window.scrollTo( { top: getIdeaHubContainerOffset(), behavior: 'smooth' } );
		}, 1000 );
	} );

	const handleTabUpdate = useCallback( ( tabIndex ) => {
		setActiveTabIndex( tabIndex );
		setHash( DashboardIdeasWidget.tabIDsByIndex[ tabIndex ] );
	}, [ setHash, setActiveTabIndex ] );

	return (
		<div className="googlesitekit-widget">
			<div className="googlesitekit-idea-hub" ref={ ideaHubContainer }>
				<div className="googlesitekit-idea-hub__header">
					<h3 className="googlesitekit-idea-hub__title">
						{ __( 'Ideas to write about based on unanswered searches', 'google-site-kit' ) }
					</h3>

					<TabBar
						activeIndex={ activeTabIndex }
						handleActiveIndexUpdate={ handleTabUpdate }
						className="googlesitekit-idea-hub__tabs"
					>
						<Tab
							focusOnActivate={ false }
						>
							{ __( 'New', 'google-site-kit' ) }
						</Tab>
						<Tab
							focusOnActivate={ false }
						>
							{ __( 'Saved', 'google-site-kit' ) }
						</Tab>
						<Tab
							focusOnActivate={ false }
						>
							{ __( 'Drafts', 'google-site-kit' ) }
						</Tab>
					</TabBar>
				</div>

				<div className="googlesitekit-idea-hub__body">
					{ activeTab === 'new-ideas' && (
						<NewIdeas />
					) }

					{ activeTab === 'saved-ideas' && (
						<SavedIdeas />
					) }

					{ activeTab === 'draft-ideas' && (
						<DraftIdeas />
					) }
				</div>
			</div>
		</div>
	);
};

DashboardIdeasWidget.tabToIndex = {
	'new-ideas': 0,
	'saved-ideas': 1,
	'draft-ideas': 2,
};

DashboardIdeasWidget.tabIDsByIndex = Object.keys( DashboardIdeasWidget.tabToIndex );

export default whenActive( { moduleName: 'idea-hub' } )( DashboardIdeasWidget );
