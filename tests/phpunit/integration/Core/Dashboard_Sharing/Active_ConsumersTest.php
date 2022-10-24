<?php
/**
 * Active_ConsumersTest
 *
 * @package   Google\Site_Kit\Tests\Core\Dashboard_Sharing
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Dashboard_Sharing;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Active_Consumers;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Active_ConsumersTest extends TestCase {

	/**
	 * @var User_Options
	 */
	protected $user_options;

	public function set_up() {
		parent::set_up();
		$user_id            = $this->factory()->user->create();
		$context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $context, $user_id );
		$meta_key           = $this->user_options->get_meta_key( Active_Consumers::OPTION );
		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );
	}

	public function test_sanitize_callback() {
		$active_consumers = new Active_Consumers( $this->user_options );
		$active_consumers->register();

		$this->assertFalse( $this->get_value() );

		// Setting the value to a non-array will result in an empty array.
		$this->set_value( false );
		$this->assertEquals( array(), $this->get_value() );

		$this->set_value( 123 );
		$this->assertEquals( array(), $this->get_value() );

		// Setting the value to an array but with non-integer keys will
		// result in an empty array.
		$this->set_value( array( 'a' => array( 'x', 'y', 'z' ) ) );
		$this->assertEquals( array(), $this->get_value() );

		// Setting the value to an array with integer keys but a non-array
		// value will result in an empty array.
		$this->set_value( array( 1 => 'a' ) );
		$this->assertEquals( array(), $this->get_value() );

		// Setting the value to an associative array with integer keys and array
		// with string values as the value works as expected.
		$this->set_value( array( 1 => array( 'a', 'b', 'c' ) ) );
		$this->assertEquals( array( 1 => array( 'a', 'b', 'c' ) ), $this->get_value() );

		// Updating with mixed integer and non-integer keys will result
		// in an array with non-integer keys filtered out.
		$this->set_value(
			array(
				1   => array( 'a', 'b', 'c' ),
				'x' => array( 'a', 'b', 'c' ),
			)
		);
		$this->assertEquals( array( 1 => array( 'a', 'b', 'c' ) ), $this->get_value() );

		// Updating with integer keys and array with mixed string and non-string
		// values will result in a nested array with non-string values filtered out.
		$this->set_value( array( 1 => array( 'a', 8, 'c' ) ) );
		$this->assertEquals( array( 1 => array( 'a', 'c' ) ), $this->get_value() );

		// Updating with a non-array will preserve the current value.
		$this->set_value( 'not an array' );
		$this->assertEquals( array( 1 => array( 'a', 'c' ) ), $this->get_value() );
	}

	public function test_add_active_consumers() {
		$active_consumers = new Active_Consumers( $this->user_options );
		$active_consumers->register();

		// Verify the active consumers list is empty.
		$this->assertEmpty( $active_consumers->get() );

		// Verify the new user is added to the active consumers list.
		$active_consumers->add( 1, array( 'editor' ) );
		$this->assertEquals(
			array(
				1 => array( 'editor' ),
			),
			$active_consumers->get()
		);

		// Verify the new user is added to the active consumers list along with the existing user.
		$active_consumers->add( 2, array( 'contributor', 'editor' ) );
		$this->assertEquals(
			array(
				1 => array( 'editor' ),
				2 => array( 'contributor', 'editor' ),
			),
			$active_consumers->get()
		);

		// Verify that adding the same user again does not result in duplicates or updating the value.
		$active_consumers->add( 1, array( 'author' ) );
		$this->assertEquals(
			array(
				1 => array( 'editor' ),
				2 => array( 'contributor', 'editor' ),
			),
			$active_consumers->get()
		);
	}

	/**
	 * Gets the value directly to isolate tested method.
	 *
	 * @return false|mixed
	 */
	protected function get_value() {
		return $this->user_options->get( Active_Consumers::OPTION );
	}

	/**
	 * Sets the value directly to isolate tested method.
	 *
	 * @param mixed $value Value to set.
	 */
	protected function set_value( $value ) {
		$this->user_options->set( Active_Consumers::OPTION, $value );
	}
}
