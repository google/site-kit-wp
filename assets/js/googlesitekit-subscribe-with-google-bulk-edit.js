/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * External dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Root from './components/Root';
import { VIEW_CONTEXT_POSTS_LIST } from './googlesitekit/constants';
import { AccessSelector } from './modules/subscribe-with-google/components/posts';
import { CORE_FORMS } from './googlesitekit/datastore/forms/constants';
import { FORM_NAME } from './modules/subscribe-with-google/datastore/constants';
const { dispatch } = Data;

/**
 * Shows Access Selector when the admin selects the "Set access to..." bulk action.
 *
 * @since n.e.x.t
 *
 * @param {string} bulkAction Which bulk action the admin selected.
 */
function showAccessSelectorBasedOnBulkAction( bulkAction ) {
	dispatch( CORE_FORMS ).setValues( FORM_NAME, {
		visible: bulkAction === 'googlesitekit-swg-access',
	} );
}

domReady( () => {
	const bulkActionSelectors = [
		...document.querySelectorAll(
			'#bulk-action-selector-top, #bulk-action-selector-bottom'
		),
	];
	for ( const bulkActionSelector of bulkActionSelectors ) {
		const accessSelectorContainer = document.createElement( 'span' );
		accessSelectorContainer.classList.add(
			'googlesitekit-swg-access-selector-container'
		);
		bulkActionSelector.after( accessSelectorContainer );

		render(
			<Root viewContext={ VIEW_CONTEXT_POSTS_LIST }>
				<AccessSelector />
			</Root>,
			accessSelectorContainer
		);

		bulkActionSelector.addEventListener( 'change', ( e ) => {
			showAccessSelectorBasedOnBulkAction( e.target.value );
		} );
	}

	// Toggle visibility immediately. Sometimes this JavaScript loads late.
	showAccessSelectorBasedOnBulkAction( bulkActionSelectors[ 0 ].value );
} );
