<?php
/**
 * Class Google\Site_Kit\Core\Notifications\Notification
 *
 * @package   Google\Site_Kit\Core\Notifications
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Notifications;

/**
 * Class for representing a notification.
 *
 * @since 1.4.0
 * @access private
 * @ignore
 */
class Notification {
	/**
	 * Unique notification slug.
	 *
	 * @since 1.4.0
	 * @var string
	 */
	private $slug;

	/**
	 * Notification arguments.
	 *
	 * @since 1.4.0
	 * @var array
	 */
	private $args;

	/**
	 * Constructor.
	 *
	 * @since 1.4.0
	 *
	 * @param string $slug Unique notification slug.
	 * @param array  $args {
	 *     Associative array of notification arguments.
	 *
	 *     @type string $title            Required notification title.
	 *     @type string $content          Required notification content. May contain inline HTML tags.
	 *     @type string $image            Image URL.
	 *     @type string $cta_url          Call to action URL.
	 *     @type string $cta_label        Call to action anchor text.
	 *     @type string $cta_target       Call to action anchor target.
	 *     @type string $learn_more_url   Learn more URL.
	 *     @type string $learn_more_label Learn more anchor text.
	 *     @type bool   $dismissible      Whether the notice should be dismissible. Default false.
	 *     @type string $dismiss_label    Dismiss anchor text.
	 * }
	 */
	public function __construct( $slug, array $args ) {
		$this->slug = (string) $slug;
		$this->args = array_merge(
			array(
				'title'            => '',
				'content'          => '',
				'image'            => '',
				'cta_url'          => '',
				'cta_label'        => '',
				'cta_target'       => '',
				'learn_more_url'   => '',
				'learn_more_label' => '',
				'dismissible'      => false,
				'dismiss_label'    => __( 'Dismiss', 'google-site-kit' ),
			),
			$args
		);
	}

	/**
	 * Gets the notification's slug.
	 *
	 * @since 1.4.0
	 *
	 * @return string Unique notification slug.
	 */
	public function get_slug() {
		return $this->slug;
	}

	/**
	 * Prepares the JS representation of the Notification.
	 *
	 * @since 1.4.0
	 *
	 * @return array
	 */
	public function prepare_for_js() {
		return array(
			'id'             => $this->get_slug(),
			'title'          => $this->args['title'],
			'content'        => $this->args['content'],
			'image'          => $this->args['image'],
			'ctaURL'         => $this->args['cta_url'],
			'ctaLabel'       => $this->args['cta_label'],
			'ctaTarget'      => $this->args['cta_target'],
			'learnMoreURL'   => $this->args['learn_more_url'],
			'learnMoreLabel' => $this->args['learn_more_label'],
			'dismissible'    => $this->args['dismissible'],
			'dismissLabel'   => $this->args['dismiss_label'],
		);
	}
}
