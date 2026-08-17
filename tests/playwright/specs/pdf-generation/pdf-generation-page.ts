/**
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
import { Download, Locator, Page, TestInfo, expect } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { pdfToPng } from 'pdf-to-png-converter';

/**
 * Page object for the in-app PDF generation export flow: opening the export
 * panel from the header, selecting sections, downloading, and the progress,
 * success and error snackbar states.
 */
export class PDFGenerationPage {
	private readonly page: Page;
	private readonly panel: Locator;

	/**
	 * Constructor.
	 *
	 * @since 1.184.0
	 *
	 * @param page The page.
	 */
	constructor( page: Page ) {
		this.page = page;
		this.panel = page.locator( '.googlesitekit-pdf-download-panel' );
	}

	/**
	 * Gets the header button that opens the export panel.
	 *
	 * @since 1.184.0
	 *
	 * @return The header PDF download button.
	 */
	get openPanelButton() {
		return this.page.getByRole( 'button', {
			name: 'Download PDF report',
		} );
	}

	/**
	 * Gets the header button that opens the features menu on mobile and tablet.
	 *
	 * @since n.e.x.t
	 *
	 * @return The features menu trigger button.
	 */
	get featuresMenuButton() {
		return this.page.getByRole( 'button', { name: 'Features' } );
	}

	/**
	 * Gets the features menu item that opens the export panel.
	 *
	 * @since n.e.x.t
	 *
	 * @return The download PDF report menu item.
	 */
	get downloadPDFReportMenuItem() {
		return this.page.getByRole( 'menuitem', {
			name: 'Download PDF report',
		} );
	}

	/**
	 * Gets the panel's "Download report" button.
	 *
	 * @since 1.184.0
	 *
	 * @return The download button.
	 */
	get downloadReportButton() {
		return this.panel.getByRole( 'button', { name: 'Download report' } );
	}

	/**
	 * Gets the section checkboxes (one per dashboard context), excluding the
	 * per-widget child checkboxes.
	 *
	 * @since 1.184.0
	 *
	 * @return The section checkbox inputs.
	 */
	get sectionCheckboxes() {
		return this.panel.locator(
			'.googlesitekit-pdf-download-panel__section input[type="checkbox"]'
		);
	}

	/**
	 * Gets a section checkbox by its dashboard-context slug.
	 *
	 * @since 1.184.0
	 *
	 * @param slug The section (dashboard context) slug.
	 * @return The section checkbox input.
	 */
	sectionCheckbox( slug: string ) {
		return this.panel.locator( `#pdf-download-section-${ slug }` );
	}

	/**
	 * Gets the progress snackbar shown while the report generates.
	 *
	 * @since 1.184.0
	 *
	 * @return The progress snackbar.
	 */
	get progressSnackbar() {
		return this.page
			.getByRole( 'status' )
			.filter( { hasText: 'Generating your PDF report' } );
	}

	/**
	 * Gets the success snackbar shown once the report is generated.
	 *
	 * @since 1.184.0
	 *
	 * @return The success snackbar.
	 */
	get successSnackbar() {
		return this.page
			.getByRole( 'status' )
			.filter( { hasText: 'Your report was generated successfully' } );
	}

	/**
	 * Gets the error snackbar shown when generation fails.
	 *
	 * @since 1.184.0
	 *
	 * @return The error snackbar.
	 */
	get errorSnackbar() {
		return this.page.getByRole( 'status' ).filter( {
			hasText: 'There was a problem generating your report',
		} );
	}

	/**
	 * Opens the export panel from the header.
	 *
	 * @since 1.184.0
	 *
	 * @return {Promise<void>} Resolves once the panel is visible.
	 */
	async openPanel() {
		// On mobile and tablet the entry point lives in the features menu
		// rather than a dedicated header icon.
		await this.featuresMenuButton
			.or( this.openPanelButton )
			.first()
			.waitFor();

		if ( await this.featuresMenuButton.isVisible() ) {
			await this.featuresMenuButton.click();
			await this.downloadPDFReportMenuItem.click();
		} else {
			await this.openPanelButton.click();
		}

		await expect( this.panel ).toBeVisible();
	}

	/**
	 * Selects only the given sections, deselecting every other section. The panel
	 * selects all sections by default, so this leaves the passed slugs checked.
	 *
	 * @since 1.184.0
	 *
	 * @param  slugs The section (dashboard context) slugs to keep selected.
	 * @return {Promise<void>} Resolves once the selection is applied.
	 */
	async deselectAllExcept( slugs: string[] ) {
		const checkboxes = await this.sectionCheckboxes.all();

		for ( const checkbox of checkboxes ) {
			const slug = await checkbox.getAttribute( 'value' );
			const keep = !! slug && slugs.includes( slug );

			if ( ! keep && ( await checkbox.isChecked() ) ) {
				await checkbox.uncheck();
			}
		}
	}

	/**
	 * Selects a single widget within one section, deselecting every other section
	 * and every sibling widget in that section.
	 *
	 * Some PDF sections group several widgets under one dashboard context (e.g. the
	 * Traffic section holds the audience tiles, the Monetization section holds the
	 * top earning pages). This keeps the parent section but leaves only the given
	 * widget checked, so the export renders that widget on its own.
	 *
	 * @since n.e.x.t
	 *
	 * @param  sectionSlug The parent section (dashboard context) slug to keep.
	 * @param  widgetSlug  The widget slug to leave selected within that section.
	 * @return {Promise<void>} Resolves once the selection is applied.
	 */
	async selectOnlyWidget( sectionSlug: string, widgetSlug: string ) {
		await this.deselectAllExcept( [ sectionSlug ] );

		// Every section renders its widgets, but the other sections' widgets are
		// already unchecked by `deselectAllExcept`, so leaving only the target
		// widget checked across the whole panel isolates it within its section.
		const widgetCheckboxes = await this.panel
			.locator(
				'.googlesitekit-pdf-download-panel__sub-section input[type="checkbox"]'
			)
			.all();

		let matched = false;

		for ( const checkbox of widgetCheckboxes ) {
			const slug = await checkbox.getAttribute( 'value' );
			const keep = slug === widgetSlug;

			if ( keep ) {
				matched = true;
			}

			if ( ! keep && ( await checkbox.isChecked() ) ) {
				await checkbox.uncheck();
			} else if ( keep && ! ( await checkbox.isChecked() ) ) {
				await checkbox.check();
			}
		}

		// Fail loudly if the widget slug matched nothing (typo or a renamed
		// widget): otherwise no section stays selected and the Download button is
		// disabled, which would surface only as an opaque download timeout.
		if ( ! matched ) {
			throw new Error(
				`No PDF widget checkbox found for slug "${ widgetSlug }".`
			);
		}
	}

	/**
	 * Clicks "Download report" and asserts a PDF file is produced.
	 *
	 * Waits for the browser download, then asserts the suggested filename ends in
	 * `.pdf` and the saved file is non-empty. Visual verification of the rendered
	 * document is handled separately by `verifyPDF()`.
	 *
	 * @since 1.184.0
	 *
	 * @return {Promise<Download>} The completed download.
	 */
	async download(): Promise< Download > {
		const downloadPromise = this.page.waitForEvent( 'download' );
		await this.downloadReportButton.click();
		const download = await downloadPromise;

		expect( download.suggestedFilename() ).toMatch( /\.pdf$/ );

		const path = await download.path();
		expect( path ).toBeTruthy();
		expect( statSync( path as string ).size ).toBeGreaterThan( 0 );

		return download;
	}

	/**
	 * Attaches the downloaded PDF to the test report and screenshots its pages.
	 *
	 * Attaches the file so it is downloadable from the Playwright report, then
	 * rasterises each PDF page to a PNG and renders them in the page so a
	 * `toHaveScreenshot` VRT baseline catches a blank or broken document.
	 * Playwright's bundled Chromium has no PDF viewer, so the PDF is rendered to
	 * images with `pdf-to-png-converter` (pdf.js) rather than shown in the
	 * browser directly.
	 *
	 * @since 1.184.0
	 *
	 * @param  download The completed download from `download()`.
	 * @param  testInfo The current test's info, used to attach the file.
	 * @return {Promise<void>} Resolves once the screenshot is taken.
	 */
	async verifyPDF( download: Download, testInfo: TestInfo ) {
		const path = ( await download.path() ) as string;

		await testInfo.attach( download.suggestedFilename(), {
			path,
			contentType: 'application/pdf',
		} );

		const pages = await pdfToPng( path, { viewportScale: 2.0 } );
		const images = pages
			.map( ( page ) =>
				page.content
					? `<img src="data:image/png;base64,${ page.content.toString(
							'base64'
					  ) }" style="display:block">`
					: ''
			)
			.join( '' );

		await this.page.setContent(
			`<style>html,body{margin:0}</style>${ images }`
		);

		await expect( this.page ).toHaveScreenshot( { fullPage: true } );
	}

	/**
	 * Reads the downloaded PDF report into a string, one character per byte.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Download} download The completed download from `download()`.
	 * @return {Promise<string>} The report's contents, byte for byte.
	 */
	async readPDFReport( download: Download ): Promise< string > {
		const path = ( await download.path() ) as string;

		// A PDF report is binary, and `latin1` copies every byte into the
		// string exactly as it is, while `utf8` would change the bytes
		// that are not letters.
		return readFileSync( path, 'latin1' );
	}

	/**
	 * Cancels an in-progress export via the progress snackbar's Cancel action.
	 *
	 * @since 1.184.0
	 *
	 * @return {Promise<void>} Resolves once Cancel is clicked.
	 */
	async cancel() {
		await this.progressSnackbar
			.getByRole( 'button', { name: 'Cancel' } )
			.click();
	}
}
