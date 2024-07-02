<?php

/**
 * VersionTest
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

class VersionTest extends TestCase {
	public function test_version_numbers_are_the_same() {
		$version_occurrences = array(
			array(
				'file'    => 'google-site-kit.php',
				'pattern' => '/\'GOOGLESITEKIT_VERSION\', \'([0-9.]+)/',
			),
			array(
				'file'    => 'google-site-kit.php',
				'pattern' => '/Version:[ ]+([0-9.]+)/',
			),
			array(
				'file'    => 'readme.txt',
				'pattern' => '/Stable tag:[ ]+([0-9.]+)/',
			),
			array(
				'file'    => 'readme.txt',
				'pattern' => '/= ([0-9.]+) =/',
			),
			array(
				'file'    => 'changelog.txt',
				'pattern' => '/= ([0-9.]+) =/',
			),
		);

		$version_numbers = array();

		foreach ( $version_occurrences as $version_occurrence ) {

			$file    = $version_occurrence['file'];
			$pattern = $version_occurrence['pattern'];

			$file_path = dirname( __FILE__ ) . '/../../../' . $file;
			// file_get_contents not used for remote request and WP_Filesystem is not appropriate here.
			// phpcs:ignore WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsUnknown
			$contents = file_get_contents( $file_path );

			preg_match( $pattern, $contents, $matches );

			// Assuming there is one capture group in each REGEX for the version, this will be
			// the 1st key in the matches. The 0th key is the full match.
			// Using preg_match, not preg_match_all, will only return the first occurrence of
			// the match which is important for the changelog.txt file which has multiple
			// version numbers and we only want to check the first.
			$version_numbers[] = $matches[1];
		}

		// Assert all version numbers are the same in the array.
		$this->assertEquals( 1, count( array_unique( $version_numbers ) ) );
	}
}

