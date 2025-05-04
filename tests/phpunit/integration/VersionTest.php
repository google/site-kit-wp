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

/**
 * Class VersionTest
 * Tests that the version numbers are the same in all the places they are defined.
 *
 * @group Version
 */
class VersionTest extends TestCase {
	public function test_version_numbers_are_the_same() {
		$semver_group_pattern = '([0-9]+\.[0-9]+\.[0-9]+)';

		$version_occurrences = array(
			array(
				'file'    => 'assets/blocks/sign-in-with-google/block.json',
				'pattern' => "/\"version\":[ ]+\"$semver_group_pattern\"/",
			),
			array(
				'file'    => 'google-site-kit.php',
				'pattern' => "/\'GOOGLESITEKIT_VERSION\', \'$semver_group_pattern\'/",
			),
			array(
				'file'    => 'google-site-kit.php',
				'pattern' => "/Version:[ ]+$semver_group_pattern/",
			),
			array(
				'file'    => 'readme.txt',
				'pattern' => "/Stable tag:[ ]+$semver_group_pattern/",
			),
			array(
				'file'    => 'readme.txt',
				'pattern' => "/= $semver_group_pattern =/",
			),
			array(
				'file'    => 'changelog.txt',
				'pattern' => "/= $semver_group_pattern =/",
			),
		);

		$version_numbers = array();

		foreach ( $version_occurrences as $version_occurrence ) {

			$file    = $version_occurrence['file'];
			$pattern = $version_occurrence['pattern'];

			$file_path = __DIR__ . '/../../../' . $file;

			// This invocation of `file_get_contents` not used for a remote request, and `WP_Filesystem` is not appropriate here.
			// Therefore, we can safely ignore the WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsUnknown sniff.
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

		// Verify the number of version numbers found matches the number of version occurrences.
		$this->assertEquals( count( $version_numbers ), count( $version_occurrences ) );

		// Assert all version numbers are the same in the array.
		$this->assertEquals( 1, count( array_unique( $version_numbers ) ) );
	}
}
