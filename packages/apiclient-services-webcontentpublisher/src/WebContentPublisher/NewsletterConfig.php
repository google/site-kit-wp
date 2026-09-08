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

class NewsletterConfig extends \Google\Model
{
  /**
   * Optional. Custom consent or disclosure text shown to the user.
   *
   * @var string
   */
  public $customConsentText;
  /**
   * Optional. A custom message displayed to the user in the signup prompt.
   *
   * @var string
   */
  public $customMessage;
  /**
   * Optional. Whether the user is required to provide their name to sign up.
   *
   * @var bool
   */
  public $nameRequired;
  /**
   * Optional. Whether checking the opt-in checkbox is required.
   *
   * @var bool
   */
  public $optInRequired;
  /**
   * Required. The title of the newsletter signup prompt.
   *
   * @var string
   */
  public $title;

  /**
   * Optional. Custom consent or disclosure text shown to the user.
   *
   * @param string $customConsentText
   */
  public function setCustomConsentText($customConsentText)
  {
    $this->customConsentText = $customConsentText;
  }
  /**
   * @return string
   */
  public function getCustomConsentText()
  {
    return $this->customConsentText;
  }
  /**
   * Optional. A custom message displayed to the user in the signup prompt.
   *
   * @param string $customMessage
   */
  public function setCustomMessage($customMessage)
  {
    $this->customMessage = $customMessage;
  }
  /**
   * @return string
   */
  public function getCustomMessage()
  {
    return $this->customMessage;
  }
  /**
   * Optional. Whether the user is required to provide their name to sign up.
   *
   * @param bool $nameRequired
   */
  public function setNameRequired($nameRequired)
  {
    $this->nameRequired = $nameRequired;
  }
  /**
   * @return bool
   */
  public function getNameRequired()
  {
    return $this->nameRequired;
  }
  /**
   * Optional. Whether checking the opt-in checkbox is required.
   *
   * @param bool $optInRequired
   */
  public function setOptInRequired($optInRequired)
  {
    $this->optInRequired = $optInRequired;
  }
  /**
   * @return bool
   */
  public function getOptInRequired()
  {
    return $this->optInRequired;
  }
  /**
   * Required. The title of the newsletter signup prompt.
   *
   * @param string $title
   */
  public function setTitle($title)
  {
    $this->title = $title;
  }
  /**
   * @return string
   */
  public function getTitle()
  {
    return $this->title;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(NewsletterConfig::class, 'Google_Service_WebContentPublisher_NewsletterConfig');
