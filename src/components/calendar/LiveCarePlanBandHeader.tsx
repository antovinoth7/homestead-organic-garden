import React from 'react';
import {
  CarePlanBandHeader,
  type CarePlanBandHeaderProps,
} from '@/components/calendar/CarePlanBand';
import { useMinuteValue } from '@/hooks/useMinuteClock';
import { farmClockLabel } from '@/utils/taskTimeWindow';

interface Props extends Omit<CarePlanBandHeaderProps, 'nowLabel'> {
  /** Whether the screen is focused — the clock only ticks while it is. */
  clockActive: boolean;
}

/**
 * A band header that keeps its own minute clock for the NOW chip. The Care Plan
 * used to hold the clock itself, so every minute re-rendered the whole screen
 * just to redraw "NOW · 6:23"; here the tick reaches only the header of the
 * band that holds the current time.
 */
export function LiveCarePlanBandHeader({
  clockActive,
  ...headerProps
}: Readonly<Props>): React.JSX.Element {
  const nowLabel = useMinuteValue(clockActive && headerProps.header.isNow === true, farmClockLabel);
  return <CarePlanBandHeader {...headerProps} nowLabel={nowLabel} />;
}
