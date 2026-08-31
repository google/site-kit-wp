<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting\Form_Title_ResolverTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Form_Metadata;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Form_Title_Resolver;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Email_Reporting
 */
class Form_Title_ResolverTest extends TestCase {

	/**
	 * Form title resolver under test.
	 *
	 * @var Form_Title_Resolver
	 */
	private $resolver;

	public function set_up() {
		parent::set_up();
		$this->resolver = new Form_Title_Resolver();
	}

	/**
	 * Creates a published `wpforms` post, which is the shape `Get_Form_Metadata` reads a
	 * title from.
	 *
	 * @param string $title Title the email shows for this form's group.
	 * @return int ID the report names as the form ID.
	 */
	private function create_form( $title ) {
		return self::factory()->post->create(
			array(
				'post_title' => $title,
				'post_type'  => 'wpforms',
			)
		);
	}

	public function test_get_titles__returns_the_stored_title_of_each_form() {
		$newsletter_form_id = $this->create_form( 'Newsletter signup form' );
		$contact_form_id    = $this->create_form( 'Contact form' );

		$this->assertSame(
			array(
				$newsletter_form_id => 'Newsletter signup form',
				$contact_form_id    => 'Contact form',
			),
			$this->resolver->get_titles( array( $newsletter_form_id, $contact_form_id ) ),
			'get_titles() should return the stored title of each form.'
		);
	}

	public function test_get_titles__falls_back_to_the_form_id_when_no_form_matches_it() {
		$this->assertSame(
			array( 999999 => 'Form #999999' ),
			$this->resolver->get_titles( array( 999999 ) ),
			'get_titles() should fall back to "Form #999999" when no form has that ID.'
		);
	}

	public function test_get_titles__keeps_the_title_of_a_form_named_zero() {
		$form_id = $this->create_form( '0' );

		$this->assertSame(
			array( $form_id => '0' ),
			$this->resolver->get_titles( array( $form_id ) ),
			'get_titles() should keep the title of a form named "0", rather than reading it as a form with no title.'
		);
	}

	public function test_get_titles__keeps_the_order_the_form_ids_arrive_in() {
		$first_form_id  = $this->create_form( 'Newsletter signup form' );
		$second_form_id = $this->create_form( 'Contact form' );

		$this->assertSame(
			array( $second_form_id, $first_form_id ),
			array_keys( $this->resolver->get_titles( array( $second_form_id, $first_form_id ) ) ),
			'get_titles() should return the form IDs in the order it receives them, so the section shows the groups in that order.'
		);
	}

	public function test_get_titles__returns_an_empty_array_when_it_receives_no_form_id() {
		$this->assertSame(
			array(),
			$this->resolver->get_titles( array() ),
			'get_titles() should return an empty array when it receives no form ID.'
		);
	}

	public function test_get_titles__falls_back_to_the_form_id_when_the_datapoint_returns_an_error() {
		$form_metadata = $this->createMock( Get_Form_Metadata::class );
		$form_metadata->method( 'create_request' )->willReturn(
			function () {
				return new WP_Error( 'form_metadata_failed', 'The form metadata datapoint failed.' );
			}
		);

		$resolver = new Form_Title_Resolver( $form_metadata );

		$this->assertSame(
			array( 12 => 'Form #12' ),
			$resolver->get_titles( array( 12 ) ),
			'get_titles() should fall back to "Form #12" when the datapoint returns an error.'
		);
	}
}
