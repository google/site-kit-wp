import domReady from '@wordpress/dom-ready';

domReady( () => {
	// Watch the bulk actions dropdown, looking for custom bulk actions
	const bulkActionSelectors = [
		...document.querySelectorAll(
			'#bulk-action-selector-top, #bulk-action-selector-bottom'
		),
	];
	for ( const bulkActionSelector of bulkActionSelectors ) {
		bulkActionSelector.addEventListener( 'change', () => {
			if ( bulkActionSelector.value !== 'sitekit-swg-access' ) {
				const swgAccessSelectors = [
					...document.querySelectorAll(
						'.sitekit-swg-access-selector'
					),
				];
				for ( const swgAccessSelector of swgAccessSelectors ) {
					swgAccessSelector.remove();
				}
				return;
			}

			for ( const el of bulkActionSelectors ) {
				const selectEl = document.createElement( 'span' );
				selectEl.innerHTML = `
				<select name="sitekit-swg-access-selector"
						class="sitekit-swg-access-selector">
					<option value="openaccess">— Free —</option>
					<option value="basic">Basic</option>
					<option value="premium">Premium</option>
				</select>`;
				el.after( selectEl );
			}
		} );
	}
} );
