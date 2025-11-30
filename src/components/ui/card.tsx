import * as React from "react"
import styled from "@emotion/styled"

const CardRoot = styled.div`
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #111827;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  space-y: 1.5rem;
  padding: 1.5rem;
`

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
  margin: 0;
`

const CardDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`

const CardContent = styled.div`
  padding: 1.5rem;
  padding-top: 0;
`

const CardFooter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 1.5rem;
  padding-top: 0;
  font-size: 14px;
`

export const Card = CardRoot
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

