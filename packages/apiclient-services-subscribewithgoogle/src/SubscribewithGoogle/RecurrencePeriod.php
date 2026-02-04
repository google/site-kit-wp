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

namespace Google\Service\SubscribewithGoogle;

class RecurrencePeriod extends \Google\Model
{
  /**
   * Unspecified.
   */
  public const UNIT_UNIT_UNSPECIFIED = 'UNIT_UNSPECIFIED';
  /**
   * Unit is a minute.
   */
  public const UNIT_MINUTELY = 'MINUTELY';
  /**
   * Unit is an hour.
   */
  public const UNIT_HOURLY = 'HOURLY';
  /**
   * Unit is a day.
   */
  public const UNIT_DAILY = 'DAILY';
  /**
   * Unit is a week.
   */
  public const UNIT_WEEKLY = 'WEEKLY';
  /**
   * Unit is a month.
   */
  public const UNIT_MONTHLY = 'MONTHLY';
  /**
   * Unit is a year.
   */
  public const UNIT_YEARLY = 'YEARLY';
  /**
   * Represents the count of the corresponding unit.
   *
   * @var int
   */
  public $count;
  /**
   * Represents the unit in which this period is specified.
   *
   * @var string
   */
  public $unit;

  /**
   * Represents the count of the corresponding unit.
   *
   * @param int $count
   */
  public function setCount($count)
  {
    $this->count = $count;
  }
  /**
   * @return int
   */
  public function getCount()
  {
    return $this->count;
  }
  /**
   * Represents the unit in which this period is specified.
   *
   * Accepted values: UNIT_UNSPECIFIED, MINUTELY, HOURLY, DAILY, WEEKLY,
   * MONTHLY, YEARLY
   *
   * @param self::UNIT_* $unit
   */
  public function setUnit($unit)
  {
    $this->unit = $unit;
  }
  /**
   * @return self::UNIT_*
   */
  public function getUnit()
  {
    return $this->unit;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(RecurrencePeriod::class, 'Google_Service_SubscribewithGoogle_RecurrencePeriod');
