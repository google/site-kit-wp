<?php
/**
 * JSON_FileTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\JSON_File;
use Google\Site_Kit\Tests\TestCase;

class JSON_FileTest extends TestCase {

	protected static $composer = array();

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		self::$composer['path'] = GOOGLESITEKIT_PLUGIN_DIR_PATH . 'composer.json';
		self::$composer['data'] = json_decode(
			file_get_contents( self::$composer['path'] ),
			true
		);
	}

	public function test_constructor() {
		try {
			new JSON_File( 'non/existent/file' );
			$this->fail( 'Expected an exception to be thrown!' );
		} catch ( \Exception $exception ) {
			$this->assertContains( 'No file exists', $exception->getMessage() );
		}
	}

	public function test_array_access() {
		$json_file = new JSON_File( self::$composer['path'] );

		// Offset exists
		$this->assertTrue( isset( $json_file['name'] ) );
		// Offset get
		$this->assertEquals( 'google/google-site-kit', $json_file['name'] );
		// Offset set (has no effect)
		$json_file['name'] = 'something/else';
		$this->assertEquals( 'google/google-site-kit', $json_file['name'] );
		// Offset unset (has no effect)
		unset( $json_file['name'] );
		$this->assertEquals( 'google/google-site-kit', $json_file['name'] );
	}

	public function test_json_serialize() {
		$json_file = new JSON_File( self::$composer['path'] );

		$this->assertEquals(
			self::$composer['data'],
			$json_file->jsonSerialize()
		);
	}

	public function test_file_is_lazy_loaded() {
		$json_file = new JSON_File( self::$composer['path'] );

		$this->assertNull( $this->force_get_property( $json_file, 'data' ) );

		$json_file['description']; // Data is loaded once, on-demand.

		$this->assertNotNull( $this->force_get_property( $json_file, 'data' ) );
	}
}
