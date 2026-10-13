/**
 * Visual regression test report.
 *
 * Renders `window.VRT_REPORT`, which `tests/vrt/reporter.js` writes to `data.js`.
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

( function () {
	const report = window.VRT_REPORT;

	if ( ! report ) {
		document.querySelector( '.vrt-list' ).textContent =
			'The report data (data.js) is missing.';
		return;
	}

	const STATUS_LABELS = {
		failed: 'Failed',
		new: 'New',
		flaky: 'Flaky',
		notRun: 'Not run',
		passed: 'Passed',
	};
	const STATUS_ORDER = [ 'failed', 'new', 'flaky', 'notRun', 'passed' ];
	const PROBLEMS = [ 'failed', 'new', 'flaky', 'notRun' ];
	const FILTERS = [ 'problems', ...STATUS_ORDER, 'all' ];
	const FILTER_LABELS = {
		...STATUS_LABELS,
		problems: 'Problems',
		all: 'All',
	};
	const VIEWPORT_ORDER = [ 'small', 'medium', 'large' ];
	// With `--repeat-each`, a story has an entry per run in each viewport.
	const isRepeated = report.entries.some( ( entry ) => entry.repeat > 0 );

	// The images an entry can have, in the order cards and the compare view
	// show them.
	const IMAGE_MODES = [
		{ key: 'reference', label: 'Reference' },
		{ key: 'actual', label: 'Test' },
		{ key: 'diff', label: 'Diff' },
		{ key: 'previous', label: 'Previous screenshot' },
		// Taken when a test fails before its screenshot, e.g. on a timeout.
		{ key: 'failure', label: 'When it failed' },
	];
	const COMPARE_MODES = [
		...IMAGE_MODES,
		{ key: 'slider', label: 'Slider' },
		{ key: 'side', label: 'Side by side' },
	];

	const header = document.querySelector( '.vrt-header' );
	const list = document.querySelector( '.vrt-list' );
	const filters = document.querySelector( '.vrt-filters' );
	const search = document.querySelector( '.vrt-search' );
	const viewportFilter = document.querySelector( '.vrt-viewport-filter' );
	const count = document.querySelector( '.vrt-count' );
	const dialog = document.querySelector( '.vrt-compare' );
	const dialogTitle = dialog.querySelector( '.vrt-compare__title' );
	const dialogSummary = dialog.querySelector( '.vrt-compare__summary' );
	const dialogModes = dialog.querySelector( '.vrt-compare__modes' );
	const stage = dialog.querySelector( '.vrt-compare__stage' );
	const actualSize = dialog.querySelector(
		'.vrt-compare__actual-size input'
	);
	const previousButton = dialog.querySelector( '.vrt-compare__previous' );
	const nextButton = dialog.querySelector( '.vrt-compare__next' );

	const state = { status: '', query: '', viewport: '' };
	let visible = [];
	let compare = null;
	let opener = null;

	/**
	 * Creates an element.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}        tag        The tag name.
	 * @param {Object}        [props]    Properties to set, such as `className` or
	 *                                   `textContent`. `attrs` sets attributes, and
	 *                                   `on` adds event listeners.
	 * @param {Array<Object>} [children] Child nodes; falsy ones are skipped.
	 * @return {Element} The element.
	 */
	function createNode( tag, props = {}, children = [] ) {
		const { attrs = {}, on = {}, ...rest } = props;
		const element = Object.assign( document.createElement( tag ), rest );

		Object.entries( attrs ).forEach( ( [ name, value ] ) =>
			element.setAttribute( name, value )
		);
		Object.entries( on ).forEach( ( [ type, listener ] ) =>
			element.addEventListener( type, listener )
		);
		children
			.filter( Boolean )
			.forEach( ( child ) => element.append( child ) );

		return element;
	}

	/**
	 * Checks whether an entry belongs under a status filter.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} entry  The report entry.
	 * @param {string} filter The status filter.
	 * @return {boolean} Whether the entry matches.
	 */
	function matchesStatus( entry, filter ) {
		if ( filter === 'all' ) {
			return true;
		}

		if ( filter === 'problems' ) {
			return PROBLEMS.includes( entry.status );
		}

		return entry.status === filter;
	}

	/**
	 * Gets the images an entry has, in display order.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} entry The report entry.
	 * @return {Array<Object>} The image modes, with each image's `src`, `width`
	 *                         and `height`.
	 */
	function getImages( entry ) {
		return IMAGE_MODES.filter( ( { key } ) => entry[ key ] ).map(
			( mode ) => ( {
				...mode,
				...entry[ mode.key ],
				label:
					mode.key === 'diff' && entry.previous
						? 'Diff between two screenshots'
						: mode.label,
			} )
		);
	}

	/**
	 * Creates an image, sized before it loads so the page doesn't shift.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} image   The image's `src`, `width` and `height`.
	 * @param {Object} [props] Other properties, as for `createNode()`.
	 * @return {Element} The image.
	 */
	function createImage( image, props = {} ) {
		return createNode( 'img', {
			// Set before `src`, which starts the download unless `loading`
			// is already `lazy`.
			...props,
			src: image.src,
			attrs: image.width
				? { width: image.width, height: image.height }
				: {},
		} );
	}

	/**
	 * Gets the compare modes available for an entry.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} entry The report entry.
	 * @return {Array<Object>} The modes.
	 */
	function getCompareModes( entry ) {
		const canCompare = entry.reference && entry.actual;

		return COMPARE_MODES.filter( ( { key } ) =>
			[ 'slider', 'side' ].includes( key ) ? canCompare : entry[ key ]
		);
	}

	/**
	 * Describes an entry's viewport, and its run if the tests were repeated.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} entry The report entry.
	 * @return {string} For example, "small", or "small, run 2".
	 */
	function describeViewport( entry ) {
		return isRepeated
			? `${ entry.viewport }, run ${ entry.repeat + 1 }`
			: entry.viewport;
	}

	/**
	 * Splits a story label into nodes that can wrap after each `/`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} label The story's label.
	 * @return {Array<string|Element>} Text and `<wbr>` elements.
	 */
	function formatLabel( label ) {
		return label
			.split( '/' )
			.flatMap( ( part, index ) =>
				index ? [ '/', createNode( 'wbr' ), part ] : [ part ]
			);
	}

	/**
	 * Formats a duration in milliseconds.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} milliseconds The duration.
	 * @return {string} For example, "3m 12s".
	 */
	function formatDuration( milliseconds ) {
		const seconds = Math.round( milliseconds / 1000 );

		return seconds >= 60
			? `${ Math.floor( seconds / 60 ) }m ${ seconds % 60 }s`
			: `${ seconds }s`;
	}

	/**
	 * Reads the filters from the URL hash.
	 *
	 * @since n.e.x.t
	 */
	function readHash() {
		const params = new URLSearchParams( window.location.hash.slice( 1 ) ); // eslint-disable-line sitekit/acronym-case
		const hasProblems = report.entries.some( ( entry ) =>
			PROBLEMS.includes( entry.status )
		);

		state.status = FILTERS.includes( params.get( 'status' ) )
			? params.get( 'status' )
			: ( hasProblems && 'problems' ) || 'all';
		state.query = params.get( 'q' ) || '';
		state.viewport = params.get( 'viewport' ) || '';
	}

	/**
	 * Saves the filters in the URL hash, so a view can be linked to.
	 *
	 * @since n.e.x.t
	 */
	function writeHash() {
		const params = new URLSearchParams( { status: state.status } ); // eslint-disable-line sitekit/acronym-case

		if ( state.query ) {
			params.set( 'q', state.query );
		}

		if ( state.viewport ) {
			params.set( 'viewport', state.viewport );
		}

		window.history.replaceState( null, '', `#${ params }` );
	}

	/**
	 * Renders the run details and any errors not tied to a test.
	 *
	 * @since n.e.x.t
	 */
	function renderRun() {
		const { run, summary, errors } = report;
		const details = [
			new Date( run.date ).toLocaleString(),
			`${ summary.total } screenshots`,
			run.duration !== undefined && formatDuration( run.duration ),
		].filter( Boolean );
		const runElement = header.querySelector( '.vrt-run' );

		runElement.textContent = details.join( ' · ' );

		if ( run.commit ) {
			runElement.append(
				' · ',
				createNode( 'a', {
					href: `https://github.com/google/site-kit-wp/commit/${ run.commit }`,
					textContent: run.commit.slice( 0, 12 ),
				} )
			);
		}

		if ( errors.length ) {
			const errorsElement = header.querySelector( '.vrt-errors' );

			errorsElement.hidden = false;
			errorsElement.textContent = errors.join( '\n\n' );
		}
	}

	/**
	 * Renders the status filters, with their counts.
	 *
	 * @since n.e.x.t
	 */
	function renderFilters() {
		filters.replaceChildren(
			...FILTERS.map( ( filter ) => {
				const total = report.entries.filter( ( entry ) =>
					matchesStatus( entry, filter )
				).length;

				return createNode(
					'button',
					{
						type: 'button',
						className: 'vrt-chip',
						disabled: ! total && filter !== state.status,
						attrs: {
							'aria-pressed': String( filter === state.status ),
						},
						on: {
							click() {
								state.status = filter;
								update();
							},
						},
					},
					[
						STATUS_LABELS[ filter ] &&
							createNode( 'span', {
								className: `vrt-status vrt-status--${ filter }`,
								textContent: ' ',
								attrs: { 'aria-hidden': 'true' },
							} ),
						FILTER_LABELS[ filter ],
						createNode( 'span', {
							className: 'vrt-chip__count',
							textContent: String( total ),
						} ),
					]
				);
			} )
		);
	}

	/**
	 * Renders an entry's card.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} entry The report entry.
	 * @param {number} index The entry's position in the visible list.
	 * @return {Element} The card.
	 */
	function renderCard( entry, index ) {
		const isProblem = PROBLEMS.includes( entry.status );
		const images = getImages( entry );

		const figures = images.map( ( image ) =>
			createNode( 'figure', { className: 'vrt-figure' }, [
				createNode( 'figcaption', { textContent: image.label } ),
				createNode(
					'button',
					{
						type: 'button',
						className: 'vrt-thumb',
						title: `Open ${ image.label.toLowerCase() }`,
						on: {
							click( event ) {
								openCompare(
									index,
									image.key,
									event.currentTarget
								);
							},
						},
					},
					[
						createImage( image, {
							loading: 'lazy',
							decoding: 'async',
							alt: `${ image.label }: ${
								entry.label
							} (${ describeViewport( entry ) })`,
						} ),
					]
				),
			] )
		);

		if ( ! entry.reference && entry.status !== 'new' ) {
			figures.unshift(
				createNode( 'figure', { className: 'vrt-figure' }, [
					createNode( 'figcaption', { textContent: 'Reference' } ),
					createNode( 'div', {
						className: 'vrt-thumb vrt-thumb--missing',
						textContent: 'No reference image.',
					} ),
				] )
			);
		}

		return createNode(
			'article',
			{
				className: `vrt-card${ isProblem ? ' vrt-card--problem' : '' }`,
			},
			[
				createNode( 'header', { className: 'vrt-card__header' }, [
					createNode( 'span', {
						className: `vrt-status vrt-status--${ entry.status }`,
						textContent: STATUS_LABELS[ entry.status ],
					} ),
					createNode(
						'h2',
						{ className: 'vrt-card__title' },
						formatLabel( entry.label )
					),
					createNode( 'span', {
						className: 'vrt-viewport',
						textContent: describeViewport( entry ),
					} ),
				] ),
				entry.summary &&
					createNode( 'p', {
						className: 'vrt-card__summary',
						textContent: entry.summary,
					} ),
				createNode( 'div', { className: 'vrt-card__images' }, figures ),
				isProblem &&
					entry.errors.length > 0 &&
					createNode( 'details', { className: 'vrt-card__error' }, [
						createNode( 'summary', { textContent: 'Error' } ),
						createNode( 'pre', {
							textContent: entry.errors.join( '\n\n' ),
						} ),
					] ),
				isProblem &&
					createNode( 'div', { className: 'vrt-card__actions' }, [
						entry.approveCommand &&
							createNode( 'code', {
								className: 'vrt-command',
								textContent: entry.approveCommand,
								title: 'Saves a new reference image for this story and viewport',
							} ),
						entry.approveCommand &&
							createNode( 'button', {
								type: 'button',
								className: 'vrt-button',
								textContent: 'Copy',
								on: {
									click( event ) {
										copyText(
											entry.approveCommand,
											event.currentTarget
										);
									},
								},
							} ),
						createNode( 'a', {
							href: `playwright/index.html#?testId=${ encodeURIComponent(
								entry.id
							) }`,
							textContent: 'Playwright details',
						} ),
					] ),
			]
		);
	}

	/**
	 * Renders the cards that match the filters.
	 *
	 * @since n.e.x.t
	 */
	function renderList() {
		const query = state.query.trim().toLowerCase();

		visible = report.entries
			.filter(
				( entry ) =>
					matchesStatus( entry, state.status ) &&
					( ! state.viewport || entry.viewport === state.viewport ) &&
					( ! query || entry.label.toLowerCase().includes( query ) )
			)
			.sort(
				( a, b ) =>
					STATUS_ORDER.indexOf( a.status ) -
						STATUS_ORDER.indexOf( b.status ) ||
					a.label.localeCompare( b.label ) ||
					VIEWPORT_ORDER.indexOf( a.viewport ) -
						VIEWPORT_ORDER.indexOf( b.viewport ) ||
					a.repeat - b.repeat
			);

		count.textContent = `Showing ${ visible.length } of ${ report.entries.length }`;

		list.replaceChildren(
			...( visible.length
				? visible.map( renderCard )
				: [
						createNode( 'p', {
							className: 'vrt-empty',
							textContent: 'No screenshots match these filters.',
						} ),
				  ] )
		);
	}

	/**
	 * Re-renders after a filter changes.
	 *
	 * @since n.e.x.t
	 */
	function update() {
		writeHash();
		renderFilters();
		renderList();
	}

	/**
	 * Copies text to the clipboard, and confirms it on the button.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}  text   The text.
	 * @param {Element} button The button that was clicked.
	 */
	function copyText( text, button ) {
		function done() {
			button.textContent = 'Copied';
			setTimeout( () => {
				button.textContent = 'Copy';
			}, 1500 );
		}

		if ( navigator.clipboard ) {
			navigator.clipboard.writeText( text ).then( done, () => {} );
			return;
		}

		const field = createNode( 'textarea', { value: text } );

		document.body.append( field );
		field.select();
		document.execCommand( 'copy' );
		field.remove();
		done();
	}

	/**
	 * Renders the slider: the screenshot covers the reference image to the
	 * right of a divider that follows the pointer.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} entry The report entry.
	 * @return {Element} The slider.
	 */
	function renderSlider( entry ) {
		const slider = createNode(
			'div',
			{ className: 'vrt-slider', attrs: { 'aria-label': 'Slider' } },
			[
				createImage( entry.reference, {
					className: 'vrt-slider__reference',
					alt: 'Reference',
				} ),
				createImage( entry.actual, {
					className: 'vrt-slider__test',
					alt: 'Test',
				} ),
				createNode( 'div', { className: 'vrt-slider__handle' } ),
				createNode( 'span', {
					className: 'vrt-slider__label vrt-slider__label--reference',
					textContent: 'Reference',
				} ),
				createNode( 'span', {
					className: 'vrt-slider__label vrt-slider__label--test',
					textContent: 'Test',
				} ),
			]
		);

		function move( event ) {
			const { left, width } = slider.getBoundingClientRect();
			const position = Math.min(
				100,
				Math.max( 0, ( ( event.clientX - left ) / width ) * 100 )
			);

			slider.style.setProperty( '--position', `${ position }%` );
		}

		slider.addEventListener( 'pointermove', move );
		slider.addEventListener( 'pointerdown', ( event ) => {
			slider.setPointerCapture( event.pointerId ); // eslint-disable-line sitekit/acronym-case
			move( event );
		} );

		return slider;
	}

	/**
	 * Renders the compare view for the current entry and mode.
	 *
	 * @since n.e.x.t
	 */
	function renderCompare() {
		const entry = visible[ compare.index ];
		const modes = getCompareModes( entry );

		if ( ! modes.some( ( { key } ) => key === compare.mode ) ) {
			compare.mode = modes[ 0 ].key;
		}

		dialogTitle.replaceChildren(
			createNode( 'span', {
				className: `vrt-status vrt-status--${ entry.status }`,
				textContent: STATUS_LABELS[ entry.status ],
			} ),
			' ',
			...formatLabel( entry.label ),
			' ',
			createNode( 'span', {
				className: 'vrt-viewport',
				textContent: describeViewport( entry ),
			} )
		);
		dialogSummary.textContent = entry.summary;

		dialogModes.replaceChildren(
			...modes.map( ( mode, position ) =>
				createNode( 'button', {
					type: 'button',
					className: 'vrt-button',
					textContent: mode.label,
					title: `${ mode.label } (${ position + 1 })`,
					attrs: {
						'aria-pressed': String( mode.key === compare.mode ),
					},
					on: {
						click() {
							compare.mode = mode.key;
							renderCompare();
						},
					},
				} )
			)
		);

		previousButton.disabled = compare.index === 0;
		nextButton.disabled = compare.index === visible.length - 1;
		dialog.classList.toggle( 'vrt-compare--fit', ! actualSize.checked );

		if ( compare.mode === 'slider' ) {
			stage.replaceChildren( renderSlider( entry ) );
		} else if ( compare.mode === 'side' ) {
			stage.replaceChildren(
				createNode( 'div', { className: 'vrt-side-by-side' }, [
					createNode( 'figure', { className: 'vrt-figure' }, [
						createNode( 'figcaption', {
							textContent: 'Reference',
						} ),
						createImage( entry.reference, { alt: 'Reference' } ),
					] ),
					createNode( 'figure', { className: 'vrt-figure' }, [
						createNode( 'figcaption', { textContent: 'Test' } ),
						createImage( entry.actual, { alt: 'Test' } ),
					] ),
				] )
			);
		} else {
			const image = getImages( entry ).find(
				( { key } ) => key === compare.mode
			);

			stage.replaceChildren( createImage( image, { alt: image.label } ) );
		}
	}

	/**
	 * Opens the compare view.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number}  index    The entry's position in the visible list.
	 * @param {string}  mode     The mode to start in.
	 * @param {Element} [source] The element to return focus to on close.
	 */
	function openCompare( index, mode, source ) {
		compare = { index, mode };
		opener = source || null;
		dialog.hidden = false;
		document.body.classList.add( 'vrt-has-dialog' );
		renderCompare();
		dialog.querySelector( '.vrt-compare__close' ).focus();
	}

	/**
	 * Closes the compare view.
	 *
	 * @since n.e.x.t
	 */
	function closeCompare() {
		compare = null;
		dialog.hidden = true;
		stage.replaceChildren();
		document.body.classList.remove( 'vrt-has-dialog' );

		if ( opener ) {
			opener.focus();
		}
	}

	/**
	 * Moves the compare view to the previous or next entry.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} offset `-1` or `1`.
	 */
	function moveCompare( offset ) {
		const index = compare.index + offset;

		if ( index >= 0 && index < visible.length ) {
			compare.index = index;
			opener = null;
			renderCompare();
		}
	}

	readHash();
	search.value = state.query;

	[
		...new Set(
			report.entries
				.map( ( entry ) => entry.viewport )
				.sort(
					( a, b ) =>
						VIEWPORT_ORDER.indexOf( a ) -
						VIEWPORT_ORDER.indexOf( b )
				)
		),
	].forEach( ( viewport ) =>
		viewportFilter.append(
			createNode( 'option', { value: viewport, textContent: viewport } )
		)
	);
	viewportFilter.value = state.viewport;

	search.addEventListener( 'input', () => {
		state.query = search.value;
		update();
	} );
	viewportFilter.addEventListener( 'change', () => {
		state.viewport = viewportFilter.value;
		update();
	} );
	previousButton.addEventListener( 'click', () => moveCompare( -1 ) );
	nextButton.addEventListener( 'click', () => moveCompare( 1 ) );
	actualSize.addEventListener( 'change', renderCompare );
	dialog
		.querySelector( '.vrt-compare__close' )
		.addEventListener( 'click', closeCompare );

	// eslint-disable-next-line @wordpress/no-global-event-listener -- The report is a standalone page.
	document.addEventListener( 'keydown', ( event ) => {
		const typing = [ 'INPUT', 'SELECT', 'TEXTAREA' ].includes(
			event.target.tagName
		);

		if ( ! compare ) {
			if ( event.key === '/' && ! typing ) {
				event.preventDefault();
				search.focus();
			}
			return;
		}

		if ( event.key === 'Escape' ) {
			closeCompare();
		} else if ( event.key === 'ArrowLeft' ) {
			moveCompare( -1 );
		} else if ( event.key === 'ArrowRight' ) {
			moveCompare( 1 );
		} else if ( /^[1-9]$/.test( event.key ) && ! typing ) {
			const mode = getCompareModes( visible[ compare.index ] )[
				Number( event.key ) - 1
			];

			if ( mode ) {
				compare.mode = mode.key;
				renderCompare();
			}
		}
	} );

	renderRun();
	update();
} )();
