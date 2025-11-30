"use client"

import * as React from "react"
import { Tooltip as RechartsTooltip } from "recharts"
import styled from "@emotion/styled"

const ChartContainerWrapper = styled.div`
  width: 100%;
`

export interface ChartConfig {
  [key: string]: {
    label?: string
    color?: string
  }
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ config, children, className }: ChartContainerProps) {
  return (
    <ChartContainerWrapper className={className}>
      {children}
    </ChartContainerWrapper>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  cursor?: boolean | object
  content?: React.ReactNode
}

const TooltipWrapper = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`

const TooltipLabel = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
`

const TooltipItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`

const TooltipColor = styled.div<{ color: string }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  background-color: ${props => props.color};
`

export function ChartTooltip(props: any) {
  return <RechartsTooltip {...props} />
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
  hideLabel?: boolean
}

export function ChartTooltipContent({ active, payload, label, hideLabel }: ChartTooltipContentProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <TooltipWrapper>
      {!hideLabel && label && <TooltipLabel>{label}</TooltipLabel>}
      {payload.map((entry: any, index: number) => {
        const config = entry.payload?.fill || entry.color || "#3b82f6";
        return (
          <TooltipItem key={index}>
            <TooltipColor color={config} />
            <span>{entry.name || entry.dataKey}: {entry.value}</span>
          </TooltipItem>
        );
      })}
    </TooltipWrapper>
  )
}

