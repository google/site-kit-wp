<?php
/**
 * Class Google\Site_Kit\Tests\Tags\GTagTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\GTag
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags;

use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Tests\TestCase;

class GTagTest extends TestCase {

	/**
	 * Holds an instance of the GTag class.
	 *
	 * @var GTag $gtag Gtag instance.
	 */
	private $gtag;

	const TEST_TAG_ID_1           = 'GT-12345';
	const TEST_TAG_ID_2           = 'GT-67890';
	const TEST_TAG_ID_2_CONFIG    = array( 'foo' => 'bar' );
	const TEST_COMMAND_1          = 'foo';
	const TEST_COMMAND_1_POSITION = 'before';
	const TEST_COMMAND_1_PARAMS   = array( 'bar', 'far' );
	const TEST_COMMAND_2_POSITION = 'after';
	const TEST_COMMAND_2          = 'foo';
	const TEST_COMMAND_2_PARAMS   = array( array( 'bar' => 'far' ) );

	public function set_up() {
		parent::set_up();

		$this->gtag = new GTag();
		$this->gtag->register();

		$this->gtag->add_tag( static::TEST_TAG_ID_1 );

		// Add commands for testing.
		$this->gtag->add_command( static::TEST_COMMAND_1, static::TEST_COMMAND_1_PARAMS, static::TEST_COMMAND_1_POSITION );
		$this->gtag->add_command( static::TEST_COMMAND_2, static::TEST_COMMAND_2_PARAMS, static::TEST_COMMAND_2_POSITION );
	}

	public function test_gtag_class_instance() {
		$this->assertInstanceOf( GTag::class, $this->gtag );
	}

	public function test_gtag_script_enqueue() {
		$this->assertFalse( wp_script_is( GTag::HANDLE ) );

		do_action( 'wp_enqueue_scripts' );

		// Assert that the gtag script is enqueued.
		$this->assertTrue( wp_script_is( GTag::HANDLE ) );
	}

	public function test_gtag_script_src() {
		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert that the gtag script src is correct.
		$this->assertEquals( 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_1, $script->src );
	}

	public function test_gtag_script_contains_gtag_call() {
		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert the array of inline script data contains the necessary gtag config line.
		// Should be in index 4, the first registered gtag.
		$this->assertEquals( 'gtag("config", "' . static::TEST_TAG_ID_1 . '");', $script->extra['after'][4] );
	}

	public function test_gtag_script_commands() {
		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Test commands in the before position.
		$this->assertEquals( sprintf( 'gtag(%s");', '"' . static::TEST_COMMAND_1 . '","' . implode( '","', static::TEST_COMMAND_1_PARAMS ) ), $script->extra['before'][1] );

		// Test commands in the after position.
		$this->assertEquals( sprintf( 'gtag(%s);', '"' . static::TEST_COMMAND_2 . '",' . json_encode( static::TEST_COMMAND_2_PARAMS[0] ) ), $script->extra['after'][5] );
	}

	public function test_gtag_with_tag_config() {
		$this->gtag->add_tag( static::TEST_TAG_ID_2, static::TEST_TAG_ID_2_CONFIG );

		// Remove already enqueued script to avoid duplication of output.
		global $wp_scripts;
		unset( $wp_scripts->registered[ GTag::HANDLE ] );

		do_action( 'wp_enqueue_scripts' );

		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert the array of inline script data contains the necessary gtag entry for the second script.
		// Should be in index 5, immediately after the first registered gtag.
		$this->assertEquals( 'gtag("config", "' . static::TEST_TAG_ID_2 . '", ' . json_encode( self::TEST_TAG_ID_2_CONFIG ) . ');', $script->extra['after'][5] );
	}

}
