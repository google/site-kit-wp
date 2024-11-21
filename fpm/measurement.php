<?php // phpcs:disable Squiz.Commenting.FileComment.SpacingAfterOpen ?>
<?php // phpcs:disable Squiz.Commenting.InlineComment.InvalidEndChar ?>
<?php

/**
 * FirstPartyServing redirect file
 *
 * @package   Google\FirstPartyLibrary
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 */

// This file should run in isolation from any other PHP file. This means using
// minimal to no external dependencies, which leads us to supressing the
// following linting rules:
//
// phpcs:disable PSR1.Files.SideEffects.FoundWithSymbols
// phpcs:disable PSR1.Classes.ClassDeclaration.MultipleClasses

/**
 * This is a stub for the measurement.php file which is used to proxy requests to the FPFE service.
 * The main body of the file will be merged into this file via issue #9665.
 *
 * PHPCS rules have been disabled at the very top of the file to allow it to be included in Site Kit's codebase mostly unmodified.
 */

if ( isset( $_GET['healthCheck'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
	echo 'ok';
	exit;
}
