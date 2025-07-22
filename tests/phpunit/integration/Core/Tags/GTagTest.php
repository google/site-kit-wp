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

	public function set_up() {
		parent::set_up();
		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		$this->gtag = new GTag();
		$this->gtag->register();
	}

	public function test_get_handle_for_tag() {
		$this->assertEquals(
			GTag::HANDLE . '-GT-12345',
			GTag::get_handle_for_tag( 'GT-12345' )
		);
	}

	public function test_gtag_script_enqueue() {
		$this->assertFalse( wp_script_is( GTag::HANDLE ) );

		$this->gtag->add_tag( 'GT-12345' );

		do_action( 'wp_enqueue_scripts' );

		// Assert that the gtag script is enqueued.
		$this->assertTrue( wp_script_is( GTag::HANDLE ) );
	}

	public function test_gtag_script_contains_gtag_call() {
		$this->gtag->add_tag( 'GT-12345' );

		do_action( 'wp_enqueue_scripts' );

		$script = wp_scripts()->registered[ GTag::HANDLE ];

		// Assert the array of inline script data contains the necessary gtag config line.
		$this->assertContains( 'gtag("config", "GT-12345");', $script->extra['after'] );
	}

	public function test_add_command() {
		$this->gtag->add_command( 'set', array( 'foo', 'bar' ) );

		do_action( 'wp_enqueue_scripts' );

		$this->assertContains(
			'gtag("set","foo","bar");',
			wp_scripts()->registered[ GTag::HANDLE ]->extra['after']
		);
	}

	public function test_gtag_with_tag_config() {
		$this->gtag->add_tag( 'GT-98765', array( 'foo' => 'bar' ) );

		do_action( 'wp_enqueue_scripts' );

		$this->assertContains(
			'gtag("config", "GT-98765", {"foo":"bar"});',
			wp_scripts()->registered[ GTag::HANDLE ]->extra['after']
		);
	}
}
