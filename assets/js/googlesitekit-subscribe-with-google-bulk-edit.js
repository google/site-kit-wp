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

function handleBulkActionSelectorChange( event ) {
	dispatch( CORE_FORMS ).setValues( FORM_NAME, {
		visible: event.target.value === 'googlesitekit-swg-access',
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

		bulkActionSelector.addEventListener(
			'change',
			handleBulkActionSelectorChange
		);
	}
} );
