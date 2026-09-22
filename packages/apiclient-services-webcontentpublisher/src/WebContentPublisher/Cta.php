<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\WebContentPublisher;

class Cta extends \Google\Model
{
  /**
   * Unspecified CTA state.
   */
  public const STATE_STATE_UNSPECIFIED = 'STATE_UNSPECIFIED';
  /**
   * The CTA is a draft and not yet visible to users.
   */
  public const STATE_DRAFT = 'DRAFT';
  /**
   * The CTA is active and visible to users.
   */
  public const STATE_ACTIVE = 'ACTIVE';
  /**
   * Unspecified CTA type.
   */
  public const TYPE_TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED';
  /**
   * CTA for newsletter subscription signup.
   */
  public const TYPE_NEWSLETTER_SIGNUP = 'NEWSLETTER_SIGNUP';
  /**
   * Required. The user-visible display name of the CTA.
   *
   * @var string
   */
  public $displayName;
  /**
   * Identifier. The resource name of the Cta. Format:
   * organizations/{organization}/publications/{publication}/ctas/{cta}
   *
   * @var string
   */
  public $name;
  protected $newsletterConfigType = NewsletterConfig::class;
  protected $newsletterConfigDataType = '';
  /**
   * Output only. The current state of this CTA.
   *
   * @var string
   */
  public $state;
  /**
   * Required. The type of this CTA.
   *
   * @var string
   */
  public $type;

  /**
   * Required. The user-visible display name of the CTA.
   *
   * @param string $displayName
   */
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  /**
   * @return string
   */
  public function getDisplayName()
  {
    return $this->displayName;
  }
  /**
   * Identifier. The resource name of the Cta. Format:
   * organizations/{organization}/publications/{publication}/ctas/{cta}
   *
   * @param string $name
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * Optional. Configuration specific to newsletter signup CTAs. Only populated
   * if type is `NEWSLETTER_SIGNUP`.
   *
   * @param NewsletterConfig $newsletterConfig
   */
  public function setNewsletterConfig(NewsletterConfig $newsletterConfig)
  {
    $this->newsletterConfig = $newsletterConfig;
  }
  /**
   * @return NewsletterConfig
   */
  public function getNewsletterConfig()
  {
    return $this->newsletterConfig;
  }
  /**
   * Output only. The current state of this CTA.
   *
   * Accepted values: STATE_UNSPECIFIED, DRAFT, ACTIVE
   *
   * @param self::STATE_* $state
   */
  public function setState($state)
  {
    $this->state = $state;
  }
  /**
   * @return self::STATE_*
   */
  public function getState()
  {
    return $this->state;
  }
  /**
   * Required. The type of this CTA.
   *
   * Accepted values: TYPE_UNSPECIFIED, NEWSLETTER_SIGNUP
   *
   * @param self::TYPE_* $type
   */
  public function setType($type)
  {
    $this->type = $type;
  }
  /**
   * @return self::TYPE_*
   */
  public function getType()
  {
    return $this->type;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Cta::class, 'Google_Service_WebContentPublisher_Cta');
