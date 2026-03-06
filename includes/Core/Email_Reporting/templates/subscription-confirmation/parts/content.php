<?php
/**
 * Content section for the subscription-confirmation email template.
 *
 * Renders the main card with envelope graphic at top, site domain,
 * title, body paragraphs, and CTA button confirming the subscription.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var string   $site_domain        The site domain.
 * @var string   $site_url           The full site URL with protocol.
 * @var string   $title              The email title.
 * @var array    $body               Body paragraphs (may contain HTML).
 * @var array    $cta                Primary CTA configuration with 'url' and 'label'.
 * @var callable $get_asset_url      Function to generate asset URLs.
 * @var callable $render_shared_part Function to render a shared part by name.
 */

$envelope_url = $get_asset_url( 'subscription-envelope-graphic' );
?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	<tr>
		<td class="card" style="background-color: #FFFFFF; border-radius: 16px; padding: 24px 16px 12px 16px;">
			<?php /* Envelope illustration at top, centered. */ ?>
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
				<tr>
					<td align="center" style="padding-bottom: 16px;">
						<img src="<?php echo esc_url( $envelope_url ); ?>" alt="" width="177" height="143" style="display: block; max-width: 100%; height: auto;" />
					</td>
				</tr>
			</table>

			<?php /* Site domain. */ ?>
			<p style="font-size: 14px; line-height: 20px; font-weight: 400; color: #6C726E; margin: 0 0 8px 0;">
				<a class="text-secondary" href="<?php echo esc_url( $site_url ); ?>" style="color: #6C726E; text-decoration: none;"><?php echo esc_html( $site_domain ); ?></a>
			</p>

			<?php /* Title from Content_Map. */ ?>
			<h1 class="text-primary" style="font-size: 16px; line-height: 24px; font-weight: 500; color: #161B18; margin: 0 0 16px 0;">
				<?php echo esc_html( $title ); ?>
			</h1>

			<?php /* Body paragraphs from Content_Map. */ ?>
			<?php foreach ( $body as $paragraph ) : ?>
			<p class="text-primary" style="font-size: 14px; line-height: 20px; font-weight: 400; color: #161B18; margin: 0 0 16px 0;">
				<?php echo wp_kses( $paragraph, array( 'strong' => array() ) ); ?>
			</p>
			<?php endforeach; ?>

			<?php /* CTA Button. */ ?>
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 4px;">
				<tr>
					<td>
						<?php
						$render_shared_part(
							'dashboard-link',
							array(
								'url'   => $cta['url'],
								'label' => isset( $cta['label'] ) ? $cta['label'] : __( 'View dashboard', 'google-site-kit' ),
							)
						);
						?>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>
