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

namespace Google\Service\Webcontentpublisher;

class Cta extends \Google\Model
{
  public const STATE_STATE_UNSPECIFIED = 'STATE_UNSPECIFIED';
  public const STATE_DRAFT = 'DRAFT';
  public const STATE_ACTIVE = 'ACTIVE';
  public const TYPE_TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED';
  public const TYPE_NEWSLETTER_SIGNUP = 'NEWSLETTER_SIGNUP';

  /**
   * The user-visible display name.
   *
   * @var string
   */
  public $displayName;
  /**
   * The resource name.
   *
   * @var string
   */
  public $name;
  protected $newsletterConfigType = NewsletterConfig::class;
  protected $newsletterConfigDataType = '';
  /**
   * The CTA state.
   *
   * @var string
   */
  public $state;
  /**
   * The CTA type.
   *
   * @var string
   */
  public $type;

  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  public function getDisplayName()
  {
    return $this->displayName;
  }
  public function setName($name)
  {
    $this->name = $name;
  }
  public function getName()
  {
    return $this->name;
  }
  public function setNewsletterConfig(NewsletterConfig $newsletterConfig)
  {
    $this->newsletterConfig = $newsletterConfig;
  }
  public function getNewsletterConfig()
  {
    return $this->newsletterConfig;
  }
  public function setState($state)
  {
    $this->state = $state;
  }
  public function getState()
  {
    return $this->state;
  }
  public function setType($type)
  {
    $this->type = $type;
  }
  public function getType()
  {
    return $this->type;
  }
}

class_alias(Cta::class, 'Google_Service_Webcontentpublisher_Cta');
