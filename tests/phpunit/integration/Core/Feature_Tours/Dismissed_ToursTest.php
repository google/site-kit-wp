<?php
/**
 * Dismissed_ToursTest
 *
 * @package   Google\Site_Kit\Tests\Core\Feature_Tours
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Tests\Core\Feature_Tours;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Feature_Tours\Dismissed_Tours;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Dismissed_ToursTest extends TestCase {

	/**
	 * @var User_Options
	 */
	protected $user_options;

	public function set_up() {
		parent::set_up();
		$user_id            = $this->factory()->user->create();
		$context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $context, $user_id );
		$meta_key           = $this->user_options->get_meta_key( Dismissed_Tours::OPTION );
		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );
	}

	public function test_add() {
		$dismissed_tours = new Dismissed_Tours( $this->user_options );
		$dismissed_tours->register();

		$this->assertEmpty( $this->get_value(), 'Dismissed tours should start with no stored slugs.' );

		$dismissed_tours->add( 'feature_a' );

		$this->assertEquals( array( 'feature_a' ), $this->get_value(), 'First dismissed tour slug should be stored.' );

		// Calling add again will only add to the saved value.
		$dismissed_tours->add( 'feature_b' );
		$this->assertEqualSets(
			array( 'feature_a', 'feature_b' ),
			$this->get_value(),
			'Adding a second tour should preserve existing dismissed tour.'
		);

		// Supports adding multiple slugs at once.
		$dismissed_tours->add( 'feature_c', 'feature_d' );
		$this->assertEqualSets(
			array( 'feature_a', 'feature_b', 'feature_c', 'feature_d' ),
			$this->get_value(),
			'Adding multiple tours should append all dismissed tour slugs.'
		);
	}

	public function test_sanitize_callback() {
		$dismissed_tours = new Dismissed_Tours( $this->user_options );
		$dismissed_tours->register();

		$this->assertFalse( $this->get_value(), 'Dismissed tours option should be unset before sanitization.' );

		// Setting the value to a non-array will result in an empty array.
		$this->set_value( false );

		$this->assertEquals( array(), $this->get_value(), 'Sanitizer should convert false value to empty list.' );

		$this->set_value( 123 );

		$this->assertEquals( array(), $this->get_value(), 'Sanitizer should convert scalar value to empty list.' );

		// Setting with an array works as expected.
		$this->set_value( array( 'feature_a' ) );
		$this->assertEquals( array( 'feature_a' ), $this->get_value(), 'Sanitizer should preserve valid dismissed tour list.' );

		// Updating with a non-array will preserve the current value.
		$this->set_value( 'not an array' );
		$this->assertEquals( array( 'feature_a' ), $this->get_value(), 'Invalid update should preserve dismissed tour list.' );

		// Duplicates are ignored.
		$this->set_value( array( 'feature_a', 'feature_a' ) );
		$this->assertEquals( array( 'feature_a' ), $this->get_value(), 'Sanitizer should remove duplicate dismissed tour slugs.' );
	}

	public function test_get() {
		$dismissed_tours = new Dismissed_Tours( $this->user_options );
		// Intentionally not registered here to isolate `get` behavior.

		// An empty value returns the default (empty array).
		$this->assertFalse( $this->get_value(), 'Dismissed tours option should be unset before get.' );
		$this->assertEquals( array(), $dismissed_tours->get(), 'Getter should return empty list for unset option.' );

		// A non-array value (e.g. DB manipulated) returns an empty array.
		$this->set_value( 'not an array' );
		$this->assertEquals( array(), $dismissed_tours->get(), 'Getter should return empty list for invalid option.' );

		// Returns the saved array when saved.
		$this->set_value( array( 'feature_a', 'feature_b' ) );
		$this->assertEquals( array( 'feature_a', 'feature_b' ), $dismissed_tours->get(), 'Getter should return stored dismissed tour slugs.' );
	}

	/**
	 * Gets the value directly to isolate tested method.
	 *
	 * @return false|mixed
	 */
	protected function get_value() {
		return $this->user_options->get( Dismissed_Tours::OPTION );
	}

	/**
	 * Sets the value directly to isolate tested method.
	 *
	 * @param mixed $value Value to set.
	 */
	protected function set_value( $value ) {
		$this->user_options->set( Dismissed_Tours::OPTION, $value );
	}
}
